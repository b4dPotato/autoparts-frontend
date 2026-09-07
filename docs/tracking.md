# First-party tracking

## Architecture

The browser, tracking API, and website are one Next.js application and one
Vercel deployment. The PostgreSQL database is hosted separately by Neon.

```text
Browser -> /api/tracking/* -> server-only Drizzle repositories -> Neon Postgres
```

The contact dialog posts validated leads to `POST /api/contact`. Each lead is
saved in `leads` before email delivery is attempted. When a live tracking
session is available, the lead stores its visitor/session relationship and a
snapshot of GCLID, GBRAID, and WBRAID attribution. A `form_submit` conversion
event is also added, but VINs, phone numbers, contact handles, and descriptions
are never copied into tracking-event metadata.

Database credentials are only read by `src/server/db/client.ts`. Never import
that module into a client component and never expose `DATABASE_URL` through a
`NEXT_PUBLIC_*` variable.

## Environment

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL=postgresql://...-pooler... # pooled runtime connection
DATABASE_URL_UNPOOLED=postgresql://... # direct migration connection
TRACKING_RETENTION_DAYS=90
TRACKING_ALLOWED_ORIGINS=https://autoparts.in.ua,https://www.autoparts.in.ua
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=choose-a-long-owner-password
ADMIN_SESSION_SECRET=generate-an-independent-32-plus-character-secret
```

Use separate Neon databases or branches for development, preview, and
production. The Next.js runtime reads `DATABASE_URL`; use Neon's pooled
connection string there. Drizzle Kit prefers `DATABASE_URL_UNPOOLED` for
migrations and falls back to `DATABASE_URL` for local/non-Neon setups.
`TRACKING_RETENTION_DAYS` is clamped to 1–3650 days and defaults to
90 when absent or invalid. `ADMIN_PASSWORD` must contain at least 12 characters,
and `ADMIN_SESSION_SECRET` must be an independently generated secret of at least
32 characters.

Lead notification email uses the Resend HTTPS API. Configure:

```env
RESEND_API_KEY=re_...
LEAD_EMAIL_FROM=AutoParts <leads@your-verified-domain.example>
LEAD_EMAIL_TO=owner@example.com,manager@example.com
```

`LEAD_EMAIL_TO` accepts a comma-separated recipient list. Missing or rejected
email configuration never removes a lead: its `email_status` becomes `failed`
and the form still receives a successful saved-request response.

Email notifications are additionally controlled by the persistent
`leadEmailNotifications` row in `feature_flags`. It defaults to `false` and is
changed only from the authenticated `/admin/settings` page. With the flag off,
the lead is saved with `email_status = 'disabled'` and no Resend request is
attempted. If the flag is on while Resend is missing or unavailable, the lead
remains saved and its email status is recorded as `failed`.

## Database setup and migrations

Install dependencies and apply committed migrations:

```bash
npm install
npm run db:migrate
```

After intentionally changing `src/server/db/schema.ts`, generate and inspect a
new migration:

```bash
npm run db:generate
npm run db:check
```

The committed migrations create:

- `tracking_visitors`: one anonymous browser installation;
- `tracking_sessions`: 30-minute inactivity sessions and first-touch
  attribution;
- `tracking_events`: bounded, meaningful page and interaction events.
- `leads`: customer requests, tracking attribution, and email delivery state.

Events cascade when their session is removed, and sessions cascade when their
visitor is removed. Indexes cover visitor/session relations, timestamps, IP,
Google click ID, and event type.

## Visitor and session lifecycle

`POST /api/tracking/session` resolves two random UUID cookies:

- `ap_vid`: `HttpOnly`, `SameSite=Lax`, secure in production, 400-day maximum;
- `ap_sid`: `HttpOnly`, `SameSite=Lax`, secure in production, 30-day maximum.

Cookie lifetime does not define session lifetime. A session is reused only when
its latest activity is less than 30 minutes old. Otherwise the prior session is
closed at its last known activity and a new session is created.

The browser never receives either identifier. IP, User-Agent, and
Accept-Language are taken from the server request. On Vercel, the IP resolver
uses Vercel's forwarded header first and then the platform's standard forwarded
header. Do not deploy behind an untrusted proxy that passes client-supplied
forwarding headers through unchanged.

The new session stores the initial path, sanitized referrer, `gclid`, `gbraid`,
`wbraid`, and UTM values. Those fields are never updated during the session.
URL query strings are not stored in page paths or referrers.

## Browser tracking

`TrackingProvider` initializes after rendering and fails closed without
affecting the page. It records:

- `page_view` on initial load and client-side route changes;
- `contact_open` for buttons that open the contact dialog;
- `phone_click`, `telegram_click`, `viber_click`, and `whatsapp_click`;
- successful `form_submit` conversions;
- selected `navigation_click` and `outbound_click` interactions.

Contact clicks continue to call the existing Google Ads conversion function.
The first semantic contact event marks the session converted and retains the
first conversion type.

The visible page sends a heartbeat about every 30 seconds. It pauses while
hidden, sends a best-effort beacon on visibility/page-hide changes, and reports
cumulative visible time. The server independently derives elapsed duration and
caps reported active duration to elapsed duration.

To declaratively track another meaningful element, use a controlled event:

```tsx
<a href="/example" data-track="navigation_click" data-track-label="example">
  Example
</a>
```

Do not track form values, VINs, typed phone numbers, free-form messages,
keystrokes, pointer movement, DOM content, or session replay data.

## API security

All tracking routes:

- accept JSON POST requests only from the exact origins configured in
  `TRACKING_ALLOWED_ORIGINS`;
- fail closed without a configured allowlist in production, while automatically
  permitting `http://localhost:3000` in development;
- reject missing production origins and cross-site browser requests;
- stream and reject request bodies above 8 KiB;
- use strict Zod schemas, allowlisted event types, string limits, and bounded
  primitive-only metadata;
- use Drizzle parameterized queries and atomic Neon batches;
- return small generic errors without stack traces or secrets in production.

The routes are intentionally public because visitors must call them. They do
not expose query or analytics capabilities. Origin checks prevent other sites
from submitting through normal browsers, but are not client authentication:
non-browser callers can spoof `Origin`. Add hosting-layer rate limiting for
stronger abuse resistance.

## Server-side analytics

`src/server/tracking/repository.ts` is server-only and provides:

- `getTrackingSummary(filters)`;
- `getTrackingDashboardData(filters)`;
- `getSessions(filters, pagination)`;
- `getVisitors(filters, pagination)`;
- `getSessionById(id)`;
- `getVisitorById(id)`;
- `getSessionsByIp(ip)`;
- `getSessionsByGclid(gclid)`.

Use these functions only from an authenticated admin surface or a trusted
server-side maintenance script. The `/admin` pages consume them directly as
protected server components; there is deliberately no public analytics API.

## Admin dashboard

Visit `/admin`. Unauthenticated requests redirect to `/admin/login`.

The password is compared in constant time on the server and is never included
in client JavaScript or HTML. Successful login creates a random, HMAC-signed
12-hour cookie with `HttpOnly`, `SameSite=Strict`, host-only scope, and `Secure`
in production. Failed logins have a best-effort per-instance limit of five
attempts per 15 minutes. Because serverless instances do not share memory, use
Vercel Firewall rate limiting if stronger distributed brute-force protection is
needed.

The dashboard provides 24-hour, 7-day, 30-day, 90-day, all-time, and custom
date ranges. It automatically refreshes every 15 seconds while visible and
online. The overview includes traffic, engagement, attribution, and channel
charts. `/admin/visitors` groups IP and cross-session history by visitor;
`/admin/sessions` provides filterable cursor pagination and detailed event
timelines.

For direct inspection during development, use the Neon SQL editor with
read-only queries such as:

```sql
select * from tracking_sessions order by started_at desc limit 25;
select * from tracking_events order by created_at desc limit 100;
select id, vin, contact_method, attribution_source, email_status, created_at
from leads order by created_at desc limit 25;
```

IP addresses and stable anonymous identifiers are personal data in many
jurisdictions. Limit access and ensure the site's privacy notice and consent
behavior cover this processing before production activation.

## Retention

`deleteExpiredTrackingData()` in `src/server/tracking/retention.ts` removes old
events, inactive sessions, and visitors based on the configured retention
period. It is reusable from a future authenticated maintenance job. No paid
scheduler or public cleanup endpoint is included.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run db:check
npm run build
```

With a local server already running and valid admin variables in its process,
the repeatable browser/Neon flow is:

```bash
BASE_URL=http://localhost:3000 ADMIN_PASSWORD=your-password npm run verify:local-flow
```

On PowerShell, set those two process variables with `$env:BASE_URL` and
`$env:ADMIN_PASSWORD` before running the command. The verifier uses a unique
`codex-*` GCLID and `codex_verification` UTM source, waits for the real heartbeat,
logs into the admin area, verifies the timeline, revisits the website, and
confirms session reuse plus attribution persistence.

Database-backed end-to-end verification requires a configured Neon development
database. Apply the migration to a clean Neon branch before running the flow.

## Production setup

1. Create or select a free Neon project and database.
2. Connect it to the Vercel project or add pooled `DATABASE_URL` and direct
   `DATABASE_URL_UNPOOLED` values to Vercel Production and Preview environments.
3. Add `TRACKING_RETENTION_DAYS=90`, the exact production
   `TRACKING_ALLOWED_ORIGINS`, and the production
   `NEXT_PUBLIC_SITE_URL`, plus a unique `ADMIN_PASSWORD` and independently
   generated `ADMIN_SESSION_SECRET`. Also configure `RESEND_API_KEY`,
   `LEAD_EMAIL_FROM`, and `LEAD_EMAIL_TO` for lead notifications.
4. Apply `npm run db:migrate` with the production connection string.
5. Redeploy and complete the database-backed checks above.

Never automatically select a paid Neon or Vercel plan.
