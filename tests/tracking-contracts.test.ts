import {describe, expect, it} from 'vitest';
import {
  eventRequestSchema,
  heartbeatRequestSchema,
  sessionRequestSchema
} from '../src/lib/tracking/contracts';

describe('tracking request contracts', () => {
  it('accepts bounded first-touch attribution', () => {
    const result = sessionRequestSchema.parse({
      landingPage: '/uk',
      referrer: 'https://google.com/search',
      gclid: 'click-id',
      gbraid: null,
      wbraid: null,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'parts',
      utmTerm: null,
      utmContent: null
    });

    expect(result.gclid).toBe('click-id');
  });

  it('rejects absolute paths and unknown fields', () => {
    expect(() =>
      sessionRequestSchema.parse({landingPage: 'https://example.com/uk'})
    ).toThrow();
    expect(() =>
      sessionRequestSchema.parse({landingPage: '/uk', arbitrary: true})
    ).toThrow();
  });

  it('allows only controlled event types and bounded metadata', () => {
    expect(() =>
      eventRequestSchema.parse({type: 'mousemove', path: '/uk'})
    ).toThrow();

    const tooManyKeys = Object.fromEntries(
      Array.from({length: 11}, (_, index) => [`key-${index}`, index])
    );
    expect(() =>
      eventRequestSchema.parse({
        type: 'page_view',
        path: '/uk',
        metadata: tooManyKeys
      })
    ).toThrow();

    expect(
      eventRequestSchema.parse({type: 'form_submit', path: '/uk'}).type
    ).toBe('form_submit');
  });

  it('caps reported active duration', () => {
    expect(() =>
      heartbeatRequestSchema.parse({activeDurationMs: 90 * 24 * 60 * 60 * 1000 + 1})
    ).toThrow();
  });
});
