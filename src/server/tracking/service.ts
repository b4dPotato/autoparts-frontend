import 'server-only';

import {randomUUID} from 'node:crypto';
import {and, eq, sql} from 'drizzle-orm';
import type {EventRequest, HeartbeatRequest, SessionRequest} from '@/lib/tracking/contracts';
import {contactEventTypes, directContactEventTypes} from '@/lib/tracking/contracts';
import {getDatabase} from '@/server/db/client';
import {sessions, trackingEvents, visitors} from '@/server/db/schema';
import {getSessionTiming, isSessionActive} from './lifecycle';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clickEventTypes = new Set([
  'contact_open',
  ...directContactEventTypes,
  'navigation_click',
  'outbound_click'
]);
const conversionEventTypes = new Set<string>(contactEventTypes);

export type RequestMetadata = {
  ip: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
};

export function isValidTrackingId(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export async function resolveTrackingSession(
  visitorCookie: string | undefined,
  sessionCookie: string | undefined,
  attribution: SessionRequest,
  requestMetadata: RequestMetadata,
  now = new Date()
) {
  const db = getDatabase();
  let visitorId = isValidTrackingId(visitorCookie) ? visitorCookie : undefined;
  let visitorExists = false;

  if (visitorId) {
    const [visitor] = await db
      .select({id: visitors.id})
      .from(visitors)
      .where(eq(visitors.id, visitorId))
      .limit(1);
    visitorExists = Boolean(visitor);
  }

  if (!visitorExists) {
    visitorId = randomUUID();
  }

  let existingSession:
    | Pick<
        typeof sessions.$inferSelect,
        'id' | 'visitorId' | 'startedAt' | 'lastActivityAt' | 'activeDurationMs'
      >
    | undefined;

  if (visitorExists && isValidTrackingId(sessionCookie)) {
    [existingSession] = await db
      .select({
        id: sessions.id,
        visitorId: sessions.visitorId,
        startedAt: sessions.startedAt,
        lastActivityAt: sessions.lastActivityAt,
        activeDurationMs: sessions.activeDurationMs
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionCookie),
          eq(sessions.visitorId, visitorId!),
          sql`${sessions.endedAt} is null`
        )
      )
      .limit(1);
  }

  if (
    existingSession &&
    isSessionActive(existingSession.lastActivityAt, now)
  ) {
    const {durationMs} = getSessionTiming(
      existingSession.startedAt,
      now,
      existingSession.activeDurationMs
    );

    await db.batch([
      db
        .update(visitors)
        .set({lastSeenAt: now})
        .where(eq(visitors.id, visitorId!)),
      db
        .update(sessions)
        .set({lastActivityAt: now, durationMs, updatedAt: now})
        .where(eq(sessions.id, existingSession.id))
    ]);

    return {visitorId: visitorId!, sessionId: existingSession.id, created: false};
  }

  const sessionId = randomUUID();
  const sessionValues: typeof sessions.$inferInsert = {
    id: sessionId,
    visitorId: visitorId!,
    startedAt: now,
    lastActivityAt: now,
    landingPage: attribution.landingPage,
    referrer: attribution.referrer,
    gclid: attribution.gclid,
    gbraid: attribution.gbraid,
    wbraid: attribution.wbraid,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmTerm: attribution.utmTerm,
    utmContent: attribution.utmContent,
    ...requestMetadata
  };

  if (!visitorExists) {
    await db.batch([
      db.insert(visitors).values({
        id: visitorId!,
        createdAt: now,
        lastSeenAt: now,
        sessionsCount: 1
      }),
      db.insert(sessions).values(sessionValues)
    ]);
  } else if (existingSession) {
    await db.batch([
      db
        .update(sessions)
        .set({endedAt: existingSession.lastActivityAt, updatedAt: now})
        .where(eq(sessions.id, existingSession.id)),
      db
        .update(visitors)
        .set({
          lastSeenAt: now,
          sessionsCount: sql`${visitors.sessionsCount} + 1`
        })
        .where(eq(visitors.id, visitorId!)),
      db.insert(sessions).values(sessionValues)
    ]);
  } else {
    await db.batch([
      db
        .update(visitors)
        .set({
          lastSeenAt: now,
          sessionsCount: sql`${visitors.sessionsCount} + 1`
        })
        .where(eq(visitors.id, visitorId!)),
      db.insert(sessions).values(sessionValues)
    ]);
  }

  return {visitorId: visitorId!, sessionId, created: true};
}

export async function getActiveSession(sessionId: string | undefined, now: Date) {
  if (!isValidTrackingId(sessionId)) {
    return null;
  }

  const db = getDatabase();
  const [session] = await db
    .select({
      id: sessions.id,
      visitorId: sessions.visitorId,
      startedAt: sessions.startedAt,
      lastActivityAt: sessions.lastActivityAt,
      activeDurationMs: sessions.activeDurationMs,
      gclid: sessions.gclid,
      gbraid: sessions.gbraid,
      wbraid: sessions.wbraid,
      utmSource: sessions.utmSource,
      referrer: sessions.referrer
    })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), sql`${sessions.endedAt} is null`))
    .limit(1);

  return session && isSessionActive(session.lastActivityAt, now) ? session : null;
}

export async function recordHeartbeat(
  sessionId: string | undefined,
  heartbeat: HeartbeatRequest,
  now = new Date()
) {
  const session = await getActiveSession(sessionId, now);

  if (!session) {
    return false;
  }

  const db = getDatabase();
  const timing = getSessionTiming(
    session.startedAt,
    now,
    Math.max(session.activeDurationMs, heartbeat.activeDurationMs)
  );

  await db.batch([
    db
      .update(sessions)
      .set({...timing, lastActivityAt: now, updatedAt: now})
      .where(eq(sessions.id, session.id)),
    db
      .update(visitors)
      .set({lastSeenAt: now})
      .where(eq(visitors.id, session.visitorId))
  ]);

  return true;
}

export async function recordTrackingEvent(
  sessionId: string | undefined,
  event: EventRequest,
  now = new Date()
) {
  const session = await getActiveSession(sessionId, now);

  if (!session) {
    return false;
  }

  const db = getDatabase();
  const isClick = clickEventTypes.has(event.type);
  const isConversion = conversionEventTypes.has(event.type);
  const {durationMs} = getSessionTiming(
    session.startedAt,
    now,
    session.activeDurationMs
  );

  await db.batch([
    db.insert(trackingEvents).values({
      id: randomUUID(),
      sessionId: session.id,
      type: event.type,
      path: event.path,
      targetType: event.targetType,
      targetText: event.targetText,
      targetHref: event.targetHref,
      targetId: event.targetId,
      metadata: event.metadata
    }),
    db
      .update(sessions)
      .set({
        lastActivityAt: now,
        durationMs,
        pageViews: event.type === 'page_view' ? sql`${sessions.pageViews} + 1` : undefined,
        clickCount: isClick ? sql`${sessions.clickCount} + 1` : undefined,
        eventCount: sql`${sessions.eventCount} + 1`,
        converted: isConversion ? true : undefined,
        conversionType: isConversion
          ? sql`coalesce(${sessions.conversionType}, ${event.type})`
          : undefined,
        updatedAt: now
      })
      .where(eq(sessions.id, session.id)),
    db
      .update(visitors)
      .set({lastSeenAt: now})
      .where(eq(visitors.id, session.visitorId))
  ]);

  return true;
}
