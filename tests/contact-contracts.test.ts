import {describe, expect, it} from 'vitest';
import {contactRequestSchema} from '../src/lib/contact/contracts';

const validRequest = {
  vin: 'WVWZZZ1JZXW000001',
  preferredContact: 'phone',
  contactValue: '+380 67 123 45 67',
  description: 'Front brake pads',
  locale: 'en',
  path: '/en'
};

describe('contact request contract', () => {
  it('normalizes and accepts a complete request', () => {
    const result = contactRequestSchema.parse({
      ...validRequest,
      vin: validRequest.vin.toLowerCase()
    });

    expect(result.vin).toBe(validRequest.vin);
    expect(result.preferredContact).toBe('phone');
  });

  it('rejects invalid VINs and unknown fields', () => {
    expect(() =>
      contactRequestSchema.parse({...validRequest, vin: 'INVALID'})
    ).toThrow();
    expect(() =>
      contactRequestSchema.parse({...validRequest, marketingConsent: true})
    ).toThrow();
  });

  it('requires a plausible phone number', () => {
    expect(() =>
      contactRequestSchema.parse({
        ...validRequest,
        preferredContact: 'phone',
        contactValue: '123'
      })
    ).toThrow();

    expect(
      contactRequestSchema.parse({
        ...validRequest,
        preferredContact: 'phone',
        contactValue: '+380 67 123 45 67'
      }).contactValue
    ).toBe('+380 67 123 45 67');
  });

  it('supports messenger contact methods at the API boundary', () => {
    const result = contactRequestSchema.parse({
      ...validRequest,
      preferredContact: 'telegram',
      contactValue: '@autoparts_customer'
    });

    expect(result.preferredContact).toBe('telegram');
  });

  it('bounds free-form data and requires a relative page path', () => {
    expect(() =>
      contactRequestSchema.parse({
        ...validRequest,
        description: 'x'.repeat(1001)
      })
    ).toThrow();
    expect(() =>
      contactRequestSchema.parse({...validRequest, path: 'https://example.com'})
    ).toThrow();
  });
});
