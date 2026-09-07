import 'server-only';

import {
  and,
  asc,
  avg,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  max,
  min,
  not,
  or,
  sql,
  sum,
  type SQL
} from 'drizzle-orm';
import {contactEventTypes} from '@/lib/tracking/contracts';
import {getDatabase} from '@/server/db/client';
import {sessions, trackingEvents, visitors} from '@/server/db/schema';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TrafficSourceFilter = 'ads' | 'utm' | 'referral' | 'direct';

export type TrackingFilters = {
  from?: Date;
  to?: Date;
  ip?: string;
  gclid?: string;
  visitorId?: string;
  query?: string;
  source?: TrafficSourceFilter;
  contacted?: boolean;
};

export type TrackingPagination = {
  after?: string;
  before?: string;
  pageSize?: number;
  sort?: 'newest' | 'oldest';
};

type Cursor = {timestamp: Date; id: string};

function adsCondition() {
  return or(
    isNotNull(sessions.gclid),
    isNotNull(sessions.gbraid),
    isNotNull(sessions.wbraid)
  )!;
}

function sourceCondition(source: TrafficSourceFilter) {
  const hasAdsId = adsCondition();
  if (source === 'ads') return hasAdsId;
  if (source === 'utm') {
    return and(not(hasAdsId), isNotNull(sessions.utmSource))!;
  }
  if (source === 'referral') {
    return and(
      not(hasAdsId),
      isNull(sessions.utmSource),
      isNotNull(sessions.referrer),
      sql`${sessions.referrer} <> ''`
    )!;
  }
  return and(
    not(hasAdsId),
    isNull(sessions.utmSource),
    or(isNull(sessions.referrer), eq(sessions.referrer, ''))
  )!;
}

function buildSessionConditions(filters: TrackingFilters) {
  const conditions: SQL[] = [];
  if (filters.from) conditions.push(gte(sessions.startedAt, filters.from));
  if (filters.to) conditions.push(lte(sessions.startedAt, filters.to));
  if (filters.ip) conditions.push(eq(sessions.ip, filters.ip));
  if (filters.gclid) conditions.push(eq(sessions.gclid, filters.gclid));
  if (filters.visitorId) conditions.push(eq(sessions.visitorId, filters.visitorId));
  if (filters.source) conditions.push(sourceCondition(filters.source));
  if (typeof filters.contacted === 'boolean') {
    conditions.push(eq(sessions.converted, filters.contacted));
  }

  const query = filters.query?.trim().slice(0, 255);
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        ilike(sessions.ip, pattern),
        ilike(sessions.gclid, pattern),
        ilike(sessions.utmSource, pattern),
        sql`${sessions.visitorId}::text ilike ${pattern}`
      )!
    );
  }
  return conditions.length ? and(...conditions) : undefined;
}

function combineConditions(...conditions: Array<SQL | undefined>) {
  const defined = conditions.filter((condition): condition is SQL => Boolean(condition));
  return defined.length ? and(...defined) : undefined;
}

function encodeCursor(timestamp: Date, id: string) {
  return Buffer.from(JSON.stringify([timestamp.toISOString(), id])).toString(
    'base64url'
  );
}

function decodeCursor(value: string | undefined): Cursor | null {
  if (!value || value.length > 300) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const timestamp = new Date(parsed[0]);
    const id = String(parsed[1]);
    if (Number.isNaN(timestamp.getTime()) || !UUID_PATTERN.test(id)) return null;
    return {timestamp, id};
  } catch {
    return null;
  }
}

async function getSummaryAggregate(filters: TrackingFilters) {
  const db = getDatabase();
  const [summary] = await db
    .select({
      totalSessions: count(sessions.id),
      uniqueVisitors: countDistinct(sessions.visitorId),
      googleAdsSessions: sql<number>`count(*) filter (where ${adsCondition()})`,
      averageSessionDurationMs: avg(sessions.durationMs),
      averageActiveDurationMs: avg(sessions.activeDurationMs),
      totalPageViews: sum(sessions.pageViews),
      totalTrackedClicks: sum(sessions.clickCount),
      convertedSessions: sql<number>`count(*) filter (where ${sessions.converted} = true)`
    })
    .from(sessions)
    .where(buildSessionConditions(filters));
  return summary;
}

async function getContactDistribution(filters: TrackingFilters) {
  const db = getDatabase();
  const rows = await db
    .select({type: trackingEvents.type, count: count(trackingEvents.id)})
    .from(trackingEvents)
    .innerJoin(sessions, eq(trackingEvents.sessionId, sessions.id))
    .where(
      combineConditions(
        buildSessionConditions(filters),
        inArray(trackingEvents.type, [...contactEventTypes])
      )
    )
    .groupBy(trackingEvents.type);
  const counts = Object.fromEntries(
    contactEventTypes.map((type) => [type, 0])
  ) as Record<(typeof contactEventTypes)[number], number>;
  for (const row of rows) {
    if (row.type in counts) counts[row.type as keyof typeof counts] = Number(row.count);
  }
  return counts;
}

export async function getTrackingSummary(filters: TrackingFilters = {}) {
  const [summary, contactsByType] = await Promise.all([
    getSummaryAggregate(filters),
    getContactDistribution(filters)
  ]);
  const totalSessions = Number(summary?.totalSessions ?? 0);
  const convertedSessions = Number(summary?.convertedSessions ?? 0);
  const contactInteractions = Object.values(contactsByType).reduce(
    (total, value) => total + value,
    0
  );
  return {
    totalSessions,
    uniqueVisitors: Number(summary?.uniqueVisitors ?? 0),
    googleAdsSessions: Number(summary?.googleAdsSessions ?? 0),
    averageSessionDurationMs: Number(summary?.averageSessionDurationMs ?? 0),
    averageActiveDurationMs: Number(summary?.averageActiveDurationMs ?? 0),
    totalPageViews: Number(summary?.totalPageViews ?? 0),
    totalTrackedClicks: Number(summary?.totalTrackedClicks ?? 0),
    contactInteractions,
    convertedSessions,
    conversionRate: totalSessions ? (convertedSessions / totalSessions) * 100 : 0,
    contactsByType
  };
}

function chartBucket(filters: TrackingFilters) {
  if (!filters.from || !filters.to) return 'month' as const;
  const duration = filters.to.getTime() - filters.from.getTime();
  if (duration <= 48 * 60 * 60 * 1000) return 'hour' as const;
  if (duration <= 90 * 24 * 60 * 60 * 1000) return 'day' as const;
  if (duration <= 365 * 24 * 60 * 60 * 1000) return 'week' as const;
  return 'month' as const;
}

async function getTrafficTrend(filters: TrackingFilters) {
  const db = getDatabase();
  const bucketSize = chartBucket(filters);
  const bucketLiteral = sql.raw(`'${bucketSize}'`);
  const bucket = sql<Date>`date_trunc(${bucketLiteral}, ${sessions.startedAt})`;
  const rows = await db
    .select({
      bucket,
      sessions: count(sessions.id),
      visitors: countDistinct(sessions.visitorId),
      pageViews: sum(sessions.pageViews),
      contacts: sql<number>`count(*) filter (where ${sessions.converted} = true)`
    })
    .from(sessions)
    .where(buildSessionConditions(filters))
    .groupBy(bucket)
    .orderBy(asc(bucket));
  return {
    bucketSize,
    points: rows.map((row) => ({
      bucket: new Date(row.bucket).toISOString(),
      sessions: Number(row.sessions ?? 0),
      visitors: Number(row.visitors ?? 0),
      pageViews: Number(row.pageViews ?? 0),
      contacts: Number(row.contacts ?? 0)
    }))
  };
}

async function getSourceDistribution(filters: TrackingFilters) {
  const db = getDatabase();
  const source = sql<string>`case
    when ${sessions.gclid} is not null or ${sessions.gbraid} is not null or ${sessions.wbraid} is not null then 'Google Ads'
    when ${sessions.utmSource} is not null then 'UTM campaigns'
    when ${sessions.referrer} is not null and ${sessions.referrer} <> '' then 'Referral'
    else 'Direct'
  end`;
  const rows = await db
    .select({source, count: count(sessions.id)})
    .from(sessions)
    .where(buildSessionConditions(filters))
    .groupBy(source)
    .orderBy(desc(count(sessions.id)));
  return rows.map((row) => ({name: row.source, value: Number(row.count)}));
}

export async function getTrackingDashboardData(filters: TrackingFilters = {}) {
  const [summary, trend, sources] = await Promise.all([
    getTrackingSummary(filters),
    getTrafficTrend(filters),
    getSourceDistribution(filters)
  ]);
  return {
    summary,
    trend,
    sources,
    contacts: [
      {name: 'Request form', value: summary.contactsByType.form_submit},
      {name: 'Phone', value: summary.contactsByType.phone_click},
      {name: 'Telegram', value: summary.contactsByType.telegram_click},
      {name: 'Viber', value: summary.contactsByType.viber_click},
      {name: 'WhatsApp', value: summary.contactsByType.whatsapp_click}
    ]
  };
}

function sessionCursorCondition(
  cursor: Cursor,
  position: 'after' | 'before',
  sort: 'newest' | 'oldest'
) {
  const seekNewer = (position === 'before') === (sort === 'newest');
  const dateComparison = seekNewer
    ? gt(sessions.startedAt, cursor.timestamp)
    : lt(sessions.startedAt, cursor.timestamp);
  const idComparison = seekNewer
    ? gt(sessions.id, cursor.id)
    : lt(sessions.id, cursor.id);
  return or(
    dateComparison,
    and(eq(sessions.startedAt, cursor.timestamp), idComparison)
  );
}

export async function getSessions(
  filters: TrackingFilters = {},
  pagination: TrackingPagination = {}
) {
  const pageSize = Math.min(100, Math.max(1, Math.trunc(pagination.pageSize ?? 25)));
  const sort = pagination.sort === 'oldest' ? 'oldest' : 'newest';
  const position = pagination.before ? 'before' : 'after';
  const cursor = decodeCursor(pagination.before ?? pagination.after);
  const reverseQuery = position === 'before' && Boolean(cursor);
  const desiredDescending = sort === 'newest';
  const queryDescending = reverseQuery ? !desiredDescending : desiredDescending;
  const where = combineConditions(
    buildSessionConditions(filters),
    cursor ? sessionCursorCondition(cursor, position, sort) : undefined
  );
  const db = getDatabase();
  const [rawItems, totalResult] = await Promise.all([
    db
      .select()
      .from(sessions)
      .where(where)
      .orderBy(
        queryDescending ? desc(sessions.startedAt) : asc(sessions.startedAt),
        queryDescending ? desc(sessions.id) : asc(sessions.id)
      )
      .limit(pageSize + 1),
    db.select({count: count()}).from(sessions).where(buildSessionConditions(filters))
  ]);
  const hasExtra = rawItems.length > pageSize;
  let items = rawItems.slice(0, pageSize);
  if (reverseQuery) items = items.reverse();
  const hasPrevious = pagination.after ? true : reverseQuery ? hasExtra : false;
  const hasNext = pagination.before ? true : hasExtra;
  return {
    items,
    pageSize,
    total: Number(totalResult[0]?.count ?? 0),
    previousCursor:
      hasPrevious && items[0] ? encodeCursor(items[0].startedAt, items[0].id) : null,
    nextCursor:
      hasNext && items.at(-1)
        ? encodeCursor(items.at(-1)!.startedAt, items.at(-1)!.id)
        : null
  };
}

export async function getVisitors(
  filters: TrackingFilters = {},
  pagination: Pick<TrackingPagination, 'after' | 'before' | 'pageSize'> = {}
) {
  const pageSize = Math.min(100, Math.max(1, Math.trunc(pagination.pageSize ?? 25)));
  const position = pagination.before ? 'before' : 'after';
  const cursor = decodeCursor(pagination.before ?? pagination.after);
  const reverseQuery = position === 'before' && Boolean(cursor);
  const latestVisit = max(sessions.startedAt);
  const firstVisit = min(sessions.startedAt);
  const cursorComparison = cursor
    ? position === 'before'
      ? sql`(${latestVisit} > ${cursor.timestamp} or (${latestVisit} = ${cursor.timestamp} and ${visitors.id} > ${cursor.id}))`
      : sql`(${latestVisit} < ${cursor.timestamp} or (${latestVisit} = ${cursor.timestamp} and ${visitors.id} < ${cursor.id}))`
    : undefined;
  const db = getDatabase();
  const sessionWhere = buildSessionConditions(filters);
  const [rawItems, totalResult] = await Promise.all([
    db
      .select({
        id: visitors.id,
        firstSeenAt: firstVisit,
        lastSeenAt: latestVisit,
        sessionCount: count(sessions.id),
        distinctIpCount: countDistinct(sessions.ip),
        lastIp: sql<string | null>`(array_agg(${sessions.ip} order by ${sessions.startedAt} desc) filter (where ${sessions.ip} is not null))[1]`,
        googleAdsSessions: sql<number>`count(*) filter (where ${adsCondition()})`,
        convertedSessions: sql<number>`count(*) filter (where ${sessions.converted} = true)`,
        activeDurationMs: sum(sessions.activeDurationMs)
      })
      .from(visitors)
      .innerJoin(sessions, eq(sessions.visitorId, visitors.id))
      .where(sessionWhere)
      .groupBy(visitors.id)
      .having(cursorComparison)
      .orderBy(
        reverseQuery ? asc(latestVisit) : desc(latestVisit),
        reverseQuery ? asc(visitors.id) : desc(visitors.id)
      )
      .limit(pageSize + 1),
    db
      .select({count: countDistinct(sessions.visitorId)})
      .from(sessions)
      .where(sessionWhere)
  ]);
  const hasExtra = rawItems.length > pageSize;
  let selected = rawItems.slice(0, pageSize);
  if (reverseQuery) selected = selected.reverse();
  const items = selected.map((item) => ({
    ...item,
    sessionCount: Number(item.sessionCount),
    distinctIpCount: Number(item.distinctIpCount),
    googleAdsSessions: Number(item.googleAdsSessions),
    convertedSessions: Number(item.convertedSessions),
    activeDurationMs: Number(item.activeDurationMs ?? 0)
  }));
  const hasPrevious = pagination.after ? true : reverseQuery ? hasExtra : false;
  const hasNext = pagination.before ? true : hasExtra;
  return {
    items,
    pageSize,
    total: Number(totalResult[0]?.count ?? 0),
    previousCursor:
      hasPrevious && items[0]
        ? encodeCursor(items[0].lastSeenAt!, items[0].id)
        : null,
    nextCursor:
      hasNext && items.at(-1)
        ? encodeCursor(items.at(-1)!.lastSeenAt!, items.at(-1)!.id)
        : null
  };
}

export async function getSessionById(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const db = getDatabase();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session) return null;
  const events = await db
    .select()
    .from(trackingEvents)
    .where(eq(trackingEvents.sessionId, id))
    .orderBy(trackingEvents.createdAt);
  return {session, events};
}

export async function getVisitorById(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const db = getDatabase();
  const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
  if (!visitor) return null;
  const [visitorSessions, summaryRows, ipRows] = await Promise.all([
    db
      .select()
      .from(sessions)
      .where(eq(sessions.visitorId, id))
      .orderBy(desc(sessions.startedAt), desc(sessions.id))
      .limit(100),
    db
      .select({
        sessionCount: count(sessions.id),
        pageViews: sum(sessions.pageViews),
        averageDurationMs: avg(sessions.durationMs),
        activeDurationMs: sum(sessions.activeDurationMs),
        convertedSessions: sql<number>`count(*) filter (where ${sessions.converted} = true)`,
        googleAdsSessions: sql<number>`count(*) filter (where ${adsCondition()})`
      })
      .from(sessions)
      .where(eq(sessions.visitorId, id)),
    db
      .select({
        ip: sessions.ip,
        firstSeenAt: min(sessions.startedAt),
        lastSeenAt: max(sessions.startedAt),
        sessionCount: count(sessions.id),
        convertedSessions: sql<number>`count(*) filter (where ${sessions.converted} = true)`
      })
      .from(sessions)
      .where(and(eq(sessions.visitorId, id), isNotNull(sessions.ip)))
      .groupBy(sessions.ip)
      .orderBy(desc(max(sessions.startedAt)))
  ]);
  const summary = summaryRows[0];
  return {
    visitor,
    sessions: visitorSessions,
    summary: {
      sessionCount: Number(summary?.sessionCount ?? 0),
      pageViews: Number(summary?.pageViews ?? 0),
      averageDurationMs: Number(summary?.averageDurationMs ?? 0),
      activeDurationMs: Number(summary?.activeDurationMs ?? 0),
      convertedSessions: Number(summary?.convertedSessions ?? 0),
      googleAdsSessions: Number(summary?.googleAdsSessions ?? 0)
    },
    ipHistory: ipRows.map((row) => ({
      ...row,
      sessionCount: Number(row.sessionCount),
      convertedSessions: Number(row.convertedSessions)
    }))
  };
}

export function getSessionsByIp(ip: string, pagination: TrackingPagination = {}) {
  return getSessions({ip}, pagination);
}

export function getSessionsByGclid(
  gclid: string,
  pagination: TrackingPagination = {}
) {
  return getSessions({gclid}, pagination);
}
