import {describe, expect, it} from 'vitest';
import {
  getSessionTiming,
  isSessionActive,
  SESSION_IDLE_TIMEOUT_MS
} from '../src/server/tracking/lifecycle';

describe('tracking session lifecycle', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');

  it('reuses a session inside the inactivity window', () => {
    const lastActivity = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS + 1);
    expect(isSessionActive(lastActivity, now)).toBe(true);
  });

  it('expires a session at the 30-minute boundary', () => {
    const lastActivity = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS);
    expect(isSessionActive(lastActivity, now)).toBe(false);
  });

  it('does not accept future activity timestamps as active', () => {
    const lastActivity = new Date(now.getTime() + 1);
    expect(isSessionActive(lastActivity, now)).toBe(false);
  });

  it('derives duration on the server and caps active duration', () => {
    const startedAt = new Date(now.getTime() - 10_000);
    expect(getSessionTiming(startedAt, now, 20_000)).toEqual({
      durationMs: 10_000,
      activeDurationMs: 10_000
    });
  });
});
