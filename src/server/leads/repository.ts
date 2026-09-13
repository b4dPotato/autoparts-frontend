import 'server-only';

import {randomUUID} from 'node:crypto';
import {and, desc, eq, gte, lte, sql, type SQL} from 'drizzle-orm';
import type {ContactRequestInput} from '@/lib/contact/contracts';
import {getDatabase} from '@/server/db/client';
import {leads, visitors} from '@/server/db/schema';
import {
  getActiveSession,
  isValidTrackingId
} from '@/server/tracking/service';

type TrackingCookies = {
  sessionId?: string;
  visitorId?: string;
};

function getAttributionSource(session: Awaited<ReturnType<typeof getActiveSession>>) {
  if (session?.gclid || session?.gbraid || session?.wbraid) return 'google_ads';
  if (session?.utmSource) return 'utm';
  if (session?.referrer) return 'referral';
  return 'direct';
}

async function resolveVisitorId(
  session: Awaited<ReturnType<typeof getActiveSession>>,
  visitorCookie: string | undefined
) {
  if (session) return session.visitorId;
  if (!isValidTrackingId(visitorCookie)) return null;

  const db = getDatabase();
  const [visitor] = await db
    .select({id: visitors.id})
    .from(visitors)
    .where(eq(visitors.id, visitorCookie))
    .limit(1);
  return visitor?.id ?? null;
}

export async function createLead(
  input: ContactRequestInput,
  trackingCookies: TrackingCookies,
  now = new Date()
) {
  const db = getDatabase();
  const session = await getActiveSession(trackingCookies.sessionId, now);
  const visitorId = await resolveVisitorId(session, trackingCookies.visitorId);
  const id = randomUUID();

  const [lead] = await db
    .insert(leads)
    .values({
      id,
      visitorId,
      sessionId: session?.id ?? null,
      vin: input.vin,
      contactMethod: input.preferredContact,
      contactValue: input.contactValue,
      description: input.description,
      locale: input.locale,
      pagePath: input.path,
      attributionSource: getAttributionSource(session),
      gclid: session?.gclid ?? null,
      gbraid: session?.gbraid ?? null,
      wbraid: session?.wbraid ?? null,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  if (!lead) throw new Error('Lead was not created');
  return lead;
}

export async function updateLeadEmailStatus(
  leadId: string,
  update:
    | {status: 'sent'; messageId: string; attemptedAt: Date; sentAt: Date}
    | {status: 'failed'; error: string; attemptedAt: Date}
) {
  const db = getDatabase();

  await db
    .update(leads)
    .set({
      emailStatus: update.status,
      emailProviderMessageId:
        update.status === 'sent' ? update.messageId.slice(0, 255) : null,
      emailError: update.status === 'failed' ? update.error.slice(0, 512) : null,
      emailAttemptedAt: update.attemptedAt,
      emailSentAt: update.status === 'sent' ? update.sentAt : null,
      updatedAt: update.attemptedAt
    })
    .where(eq(leads.id, leadId));
}

export async function deleteLeadById(leadId: string) {
  const db = getDatabase();
  const [deletedLead] = await db
    .delete(leads)
    .where(eq(leads.id, leadId))
    .returning({id: leads.id});

  return Boolean(deletedLead);
}

export async function getLeadDashboardData({
  from,
  to
}: {
  from?: Date;
  to?: Date;
}) {
  const db = getDatabase();
  const filters: SQL[] = [];

  if (from) filters.push(gte(leads.createdAt, from));
  if (to) filters.push(lte(leads.createdAt, to));

  const where = filters.length ? and(...filters) : undefined;
  const [items, [summary]] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(100),
    db
      .select({
        total: sql<number>`count(*)::int`,
        newLeads: sql<number>`count(*) filter (where ${leads.status} = 'new')::int`,
        emailsSent: sql<number>`count(*) filter (where ${leads.emailStatus} = 'sent')::int`,
        emailsFailed: sql<number>`count(*) filter (where ${leads.emailStatus} = 'failed')::int`
      })
      .from(leads)
      .where(where)
  ]);

  return {
    items,
    summary: summary ?? {
      total: 0,
      newLeads: 0,
      emailsSent: 0,
      emailsFailed: 0
    }
  };
}
