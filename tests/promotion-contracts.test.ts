import {describe, expect, it} from 'vitest';
import {promotionSchema} from '../src/lib/promotions/contracts';
import {defaultPromotion} from '../src/lib/promotions/default';
import {eventRequestSchema} from '../src/lib/tracking/contracts';

describe('featured promotion contracts', () => {
  it('provides the supplied specifications in all supported languages', () => {
    const promotion = promotionSchema.parse(defaultPromotion);
    expect(promotion.mileage).toBe('75 719');
    expect(promotion.ecu).toBe('89530-70130 / 324811-13890');
    for (const content of Object.values(promotion.content)) {
      expect(content.transmission).toContain('20TT02');
      expect(content.included.split('\n')).toHaveLength(7);
      expect(content.vehicle).toContain('2005–2014');
    }
    expect(promotion.image).toBe('');
  });
  it('requires complete translations and rejects unsafe or oversized image sources', () => {
    expect(
      promotionSchema.safeParse({
        ...defaultPromotion,
        content: {uk: defaultPromotion.content.uk},
      }).success,
    ).toBe(false);
    for (const image of [
      'javascript:alert(1)',
      'https://example.com/unknown.jpg',
      'data:image/svg+xml;base64,PHN2Zz4=',
      'x'.repeat(700001),
    ]) {
      expect(
        promotionSchema.safeParse({...defaultPromotion, image}).success,
      ).toBe(false);
    }
  });
  it('allows disabling the banner and bounded uploaded raster images', () => {
    expect(
      promotionSchema.parse({
        ...defaultPromotion,
        enabled: false,
        image: 'data:image/png;base64,YQ==',
      }).enabled,
    ).toBe(false);
  });
  it('accepts promotion events and preserves context on existing contact events', () => {
    for (const type of [
      'promotion_impression',
      'promotion_details_open',
      'phone_click',
      'viber_click',
      'telegram_click',
      'whatsapp_click',
    ]) {
      const event = eventRequestSchema.parse({
        type,
        path: '/uk',
        metadata: {
          promotionId: defaultPromotion.id,
          placement: 'details',
          locale: 'uk',
        },
      });
      expect(event.metadata?.promotionId).toBe(defaultPromotion.id);
    }
  });
});
