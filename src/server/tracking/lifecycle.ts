export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const VISITOR_COOKIE_NAME = 'ap_vid';
export const SESSION_COOKIE_NAME = 'ap_sid';

export function isSessionActive(
  lastActivityAt: Date,
  now: Date,
  idleTimeoutMs = SESSION_IDLE_TIMEOUT_MS
) {
  const idleForMs = now.getTime() - lastActivityAt.getTime();
  return idleForMs >= 0 && idleForMs < idleTimeoutMs;
}

export function getSessionTiming(
  startedAt: Date,
  now: Date,
  reportedActiveDurationMs: number
) {
  const durationMs = Math.max(0, now.getTime() - startedAt.getTime());

  return {
    durationMs,
    activeDurationMs: Math.min(
      durationMs,
      Math.max(0, Math.trunc(reportedActiveDurationMs))
    )
  };
}
