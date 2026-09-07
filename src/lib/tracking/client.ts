'use client';

import type {
  EventRequest,
  TrackingEventType
} from '@/lib/tracking/contracts';

type SessionResult = {ok: true; created: boolean} | {ok: false};

let sessionRequest: Promise<SessionResult> | null = null;
let sessionReady = false;
let lastSessionAttemptAt = 0;
const RETRY_COOLDOWN_MS = 30_000;

function getSafePath() {
  return window.location.pathname.slice(0, 2048) || '/';
}

function getSafeReferrer() {
  if (!document.referrer) return null;

  try {
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`.slice(0, 2048);
  } catch {
    return null;
  }
}

function getAttribution() {
  const parameters = new URLSearchParams(window.location.search);
  const read = (name: string, maximum: number) =>
    parameters.get(name)?.trim().slice(0, maximum) || null;

  return {
    landingPage: getSafePath(),
    referrer: getSafeReferrer(),
    gclid: read('gclid', 255),
    gbraid: read('gbraid', 255),
    wbraid: read('wbraid', 255),
    utmSource: read('utm_source', 255),
    utmMedium: read('utm_medium', 255),
    utmCampaign: read('utm_campaign', 512),
    utmTerm: read('utm_term', 512),
    utmContent: read('utm_content', 512)
  };
}

async function postTracking(path: string, body: unknown) {
  return fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body),
    keepalive: true
  });
}

export function initializeTracking(force = false): Promise<SessionResult> {
  const now = Date.now();

  if (!force && sessionRequest) return sessionRequest;
  if (!force && now - lastSessionAttemptAt < RETRY_COOLDOWN_MS) {
    return Promise.resolve({ok: false});
  }

  lastSessionAttemptAt = now;
  const request = postTracking('/api/tracking/session', getAttribution())
    .then(async (response): Promise<SessionResult> => {
      if (!response.ok) return {ok: false};

      const result = (await response.json()) as {created?: boolean};
      sessionReady = true;
      return {ok: true, created: result.created === true};
    })
    .catch((): SessionResult => ({ok: false}));
  sessionRequest = request;

  void request.then((result) => {
    if (!result.ok && sessionRequest === request) {
      sessionRequest = null;
    }
  });

  return request;
}

async function sendWithSession(
  path: string,
  body: unknown,
  retry = true
): Promise<boolean> {
  const session = await initializeTracking();
  if (!session.ok) return false;

  try {
    const response = await postTracking(path, body);

    if (response.status === 409 && retry) {
      sessionRequest = null;
      sessionReady = false;
      const replacement = await initializeTracking(true);
      return replacement.ok ? sendWithSession(path, body, false) : false;
    }

    return response.ok;
  } catch {
    return false;
  }
}

export function trackEvent(
  event: Omit<EventRequest, 'path'> & {path?: string}
) {
  void sendWithSession('/api/tracking/event', {
    ...event,
    path: event.path ?? getSafePath()
  });
}

export function trackElementEvent(
  type: TrackingEventType,
  element: HTMLElement,
  metadata?: EventRequest['metadata']
) {
  const anchor = element.closest<HTMLAnchorElement>('a');
  const text = element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 256);

  trackEvent({
    type,
    targetType: element.tagName.toLowerCase().slice(0, 64),
    targetText: text || null,
    targetHref: anchor?.href.slice(0, 2048) ?? null,
    targetId: element.id.slice(0, 128) || null,
    metadata
  });
}

export function sendHeartbeat(activeDurationMs: number) {
  void sendWithSession('/api/tracking/heartbeat', {
    activeDurationMs: Math.max(0, Math.trunc(activeDurationMs))
  });
}

export function sendHeartbeatBeacon(activeDurationMs: number) {
  if (!sessionReady || !navigator.sendBeacon) return false;

  const body = new Blob(
    [JSON.stringify({activeDurationMs: Math.max(0, Math.trunc(activeDurationMs))})],
    {type: 'application/json'}
  );

  return navigator.sendBeacon('/api/tracking/heartbeat', body);
}
