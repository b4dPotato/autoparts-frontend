import {describe, expect, it} from 'vitest';
import {
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken
} from '../src/server/admin/session-token';

describe('admin session tokens', () => {
  const secret = 'a-secure-test-secret-that-is-longer-than-thirty-two-characters';
  const now = new Date('2026-09-06T12:00:00.000Z');

  it('accepts an intact unexpired token', () => {
    const token = createAdminSessionToken(secret, now);
    expect(verifyAdminSessionToken(token, secret, now)).toBe(true);
  });

  it('rejects tampering and the wrong secret', () => {
    const token = createAdminSessionToken(secret, now);
    expect(verifyAdminSessionToken(`${token}x`, secret, now)).toBe(false);
    expect(
      verifyAdminSessionToken(
        token,
        'a-different-secure-secret-that-is-long-enough-for-tests',
        now
      )
    ).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = createAdminSessionToken(secret, now);
    const expiredAt = new Date(
      now.getTime() + (ADMIN_SESSION_TTL_SECONDS + 1) * 1000
    );
    expect(verifyAdminSessionToken(token, secret, expiredAt)).toBe(false);
  });
});
