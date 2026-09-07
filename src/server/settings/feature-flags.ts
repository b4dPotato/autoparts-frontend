import 'server-only';

import {eq} from 'drizzle-orm';
import {getDatabase} from '@/server/db/client';
import {featureFlags} from '@/server/db/schema';

export const LEAD_EMAIL_NOTIFICATIONS = 'leadEmailNotifications';

export async function isLeadEmailNotificationsEnabled() {
  const db = getDatabase();
  const [flag] = await db
    .select({enabled: featureFlags.enabled})
    .from(featureFlags)
    .where(eq(featureFlags.name, LEAD_EMAIL_NOTIFICATIONS))
    .limit(1);

  return flag?.enabled ?? false;
}

export async function setLeadEmailNotificationsEnabled(enabled: boolean) {
  const db = getDatabase();

  await db
    .insert(featureFlags)
    .values({
      name: LEAD_EMAIL_NOTIFICATIONS,
      enabled,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: featureFlags.name,
      set: {enabled, updatedAt: new Date()}
    });
}
