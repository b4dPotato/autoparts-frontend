import {describe, expect, it} from 'vitest';
import {formatAdminDate} from '../src/components/admin/format';

describe('admin timestamp formatting', () => {
  const now = new Date('2026-09-06T12:00:00.000Z');

  it('shows seconds for sessions created less than a minute ago', () => {
    expect(formatAdminDate('2026-09-06T11:59:50.000Z', now)).toBe('10 seconds ago');
    expect(formatAdminDate('2026-09-06T11:59:59.000Z', now)).toBe('1 second ago');
  });

  it('shows minutes until the five-minute boundary', () => {
    expect(formatAdminDate('2026-09-06T11:59:00.000Z', now)).toBe('1 minute ago');
    expect(formatAdminDate('2026-09-06T11:55:01.000Z', now)).toBe('4 minutes ago');
  });

  it('uses the absolute Kyiv date at five minutes and later', () => {
    expect(formatAdminDate('2026-09-06T11:55:00.000Z', now)).toBe(
      '6 Sept 2026, 14:55'
    );
  });
});
