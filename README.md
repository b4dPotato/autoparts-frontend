# AutoParts Ukraine

Localized Next.js website for `autoparts.in.ua`.

Developer setup and tracking architecture are documented in
[docs/tracking.md](docs/tracking.md).

## Featured Hero promotion

Manage the offer in **Admin → Settings → Featured parts promotion**. Toggle
visibility, edit Ukrainian/Russian/English specifications, and upload or remove
a verified PNG/JPEG/WebP photo (up to 500 KB). The initial Peugeot offer has no
photo. Details and contact channels remain available in the responsive dialog.

Apply Drizzle migrations before deploying this feature (`npm run db:migrate`
with the target database environment loaded). The `promotions` table stores the
single offer and its optional photo in Neon. Saving invalidates all three public
locale pages, so edits and visibility changes do not require redeployment.

First-party analytics records `promotion_impression` once per visible offer and
locale, `promotion_details_open` on opening, and the existing contact events
with `promotionId`, `placement`, and `locale` metadata. Contact events retain
the existing conversion behavior.

With the local server running and the database/admin environment loaded, run
`node scripts/verify-promotion.mjs` for mobile/desktop, keyboard, localization,
analytics, admin persistence, and image checks. It restores promotion data and
writes screenshots to `qa/promotion/`. For a local production server whose
analytics origin policy excludes localhost, add `--ui-only`; analytics should
still be checked on the development server.
