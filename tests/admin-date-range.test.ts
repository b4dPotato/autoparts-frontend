import {describe, expect, it} from 'vitest';
import {parseAdminDateRange} from '../src/server/admin/date-range';

describe('admin date ranges', () => {
  const now = new Date('2026-09-06T12:00:00.000Z');

  it('defaults to the last 30 days', () => {
    const range = parseAdminDateRange({}, now);
    expect(range.key).toBe('30d');
    expect(range.from?.toISOString()).toBe('2026-08-07T12:00:00.000Z');
    expect(range.to).toEqual(now);
  });

  it('supports all-time and custom ranges', () => {
    expect(parseAdminDateRange({range: 'all'}, now).from).toBeUndefined();

    const custom = parseAdminDateRange(
      {from: '2026-09-01', to: '2026-09-05'},
      now
    );
    expect(custom.key).toBe('custom');
    expect(custom.from?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(custom.to?.toISOString()).toBe('2026-09-05T23:59:59.999Z');
  });

  it('supports a rolling 24-hour range', () => {
    const range = parseAdminDateRange({range: '24h'}, now);
    expect(range.key).toBe('24h');
    expect(range.from?.toISOString()).toBe('2026-09-05T12:00:00.000Z');
    expect(range.to).toEqual(now);
  });
});
