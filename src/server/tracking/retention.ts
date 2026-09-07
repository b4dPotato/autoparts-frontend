import 'server-only';

import {lt} from 'drizzle-orm';
import {getDatabase} from '@/server/db/client';
import {sessions, trackingEvents, visitors} from '@/server/db/schema';

const DEFAULT_RETENTION_DAYS = 90;
const MINIMUM_RETENTION_DAYS = 1;
const MAXIMUM_RETENTION_DAYS = 3650;

export function getTrackingRetentionDays() {
  const configured = Number.parseInt(
    process.env.TRACKING_RETENTION_DAYS ?? '',
    10
  );

  if (!Number.isFinite(configured)) return DEFAULT_RETENTION_DAYS;

  return Math.min(
    MAXIMUM_RETENTION_DAYS,
    Math.max(MINIMUM_RETENTION_DAYS, configured)
  );
}

export async function deleteExpiredTrackingData(now = new Date()) {
  const db = getDatabase();
  const retentionDays = getTrackingRetentionDays();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

  const [deletedEvents, deletedSessions, deletedVisitors] = await db.batch([
    db
      .delete(trackingEvents)
      .where(lt(trackingEvents.createdAt, cutoff))
      .returning({id: trackingEvents.id}),
    db
      .delete(sessions)
      .where(lt(sessions.lastActivityAt, cutoff))
      .returning({id: sessions.id}),
    db
      .delete(visitors)
      .where(lt(visitors.lastSeenAt, cutoff))
      .returning({id: visitors.id})
  ]);

  return {
    cutoff,
    retentionDays,
    deletedEvents: deletedEvents.length,
    deletedSessions: deletedSessions.length,
    deletedVisitors: deletedVisitors.length
  };
}
