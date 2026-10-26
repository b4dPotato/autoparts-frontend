import 'server-only';
import {eq} from 'drizzle-orm';
import {getDatabase} from '@/server/db/client';
import {promotions} from '@/server/db/schema';
import {promotionSchema, type Promotion} from '@/lib/promotions/contracts';
import {defaultPromotion} from '@/lib/promotions/default';

export async function getPromotion(): Promise<Promotion> {
  const [row] = await getDatabase()
    .select()
    .from(promotions)
    .where(eq(promotions.id, defaultPromotion.id))
    .limit(1);
  return row ? promotionSchema.parse(row.data) : defaultPromotion;
}

export async function getPublicPromotion(): Promise<Promotion | null> {
  try {
    const promotion = await getPromotion();
    return promotion.enabled ? promotion : null;
  } catch {
    console.error('Featured promotion could not be loaded; banner hidden.');
    return null;
  }
}

export async function savePromotion(promotion: Promotion) {
  const data = promotionSchema.parse(promotion);
  await getDatabase()
    .insert(promotions)
    .values({id: data.id, data})
    .onConflictDoUpdate({
      target: promotions.id,
      set: {data, updatedAt: new Date()},
    });
}
