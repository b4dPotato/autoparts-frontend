import 'server-only';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = {
  failures: number;
  windowStartedAt: number;
};

const attempts = new Map<string, Attempt>();

function currentAttempt(key: string, now: number) {
  const attempt = attempts.get(key);

  if (!attempt || now - attempt.windowStartedAt >= WINDOW_MS) {
    const fresh = {failures: 0, windowStartedAt: now};
    attempts.set(key, fresh);
    return fresh;
  }

  return attempt;
}

export function canAttemptAdminLogin(key: string, now = Date.now()) {
  return currentAttempt(key, now).failures < MAX_FAILURES;
}

export function recordFailedAdminLogin(key: string, now = Date.now()) {
  const attempt = currentAttempt(key, now);
  attempt.failures += 1;
}

export function clearAdminLoginFailures(key: string) {
  attempts.delete(key);
}
