import {describe, expect, it} from 'vitest';
import {parseAllowedTrackingOrigins} from '../src/lib/tracking/origin';

describe('tracking origin allowlist', () => {
  it('fails closed in production when no origins are configured', () => {
    expect(parseAllowedTrackingOrigins('production', undefined).size).toBe(0);
  });

  it('allows only normalized configured production origins', () => {
    const origins = parseAllowedTrackingOrigins(
      'production',
      'https://autoparts.in.ua, https://www.autoparts.in.ua, javascript:alert(1), https://evil.test/path'
    );
    expect([...origins]).toEqual([
      'https://autoparts.in.ua',
      'https://www.autoparts.in.ua'
    ]);
  });

  it('adds localhost only outside production', () => {
    expect(parseAllowedTrackingOrigins('development', undefined).has('http://localhost:3000')).toBe(true);
    expect(parseAllowedTrackingOrigins('production', 'https://autoparts.in.ua').has('http://localhost:3000')).toBe(false);
  });
});
