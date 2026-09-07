'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef} from 'react';
import {trackingEventTypes, type TrackingEventType} from '@/lib/tracking/contracts';
import {
  initializeTracking,
  sendHeartbeat,
  sendHeartbeatBeacon,
  trackElementEvent,
  trackEvent
} from '@/lib/tracking/client';

const HEARTBEAT_INTERVAL_MS = 30_000;
const ACTIVE_STORAGE_KEY = 'ap_tracking_active_ms';
const eventTypes = new Set<string>(trackingEventTypes);

function readStoredActiveDuration() {
  const value = Number.parseInt(sessionStorage.getItem(ACTIVE_STORAGE_KEY) ?? '', 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function TrackingProvider() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const activeDuration = useRef(0);
  const activeSince = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;

    void initializeTracking().then((result) => {
      if (disposed || !result.ok) return;

      activeDuration.current = result.created ? 0 : readStoredActiveDuration();
      sessionStorage.setItem(
        ACTIVE_STORAGE_KEY,
        String(activeDuration.current)
      );

      if (document.visibilityState === 'visible') {
        activeSince.current = performance.now();
      }
    });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!pathname || lastTrackedPath.current === pathname) return;

    lastTrackedPath.current = pathname;
    trackEvent({type: 'page_view', path: pathname});
  }, [pathname]);

  useEffect(() => {
    const commitActiveTime = () => {
      if (activeSince.current !== null) {
        activeDuration.current += Math.max(
          0,
          performance.now() - activeSince.current
        );
        activeSince.current = null;
        sessionStorage.setItem(
          ACTIVE_STORAGE_KEY,
          String(Math.trunc(activeDuration.current))
        );
      }
    };

    const heartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      commitActiveTime();
      activeSince.current = performance.now();
      sendHeartbeat(activeDuration.current);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void initializeTracking(true).then((result) => {
          if (!result.ok) return;
          if (result.created) {
            activeDuration.current = 0;
            sessionStorage.setItem(ACTIVE_STORAGE_KEY, '0');
          }
          activeSince.current = performance.now();
        });
      } else {
        commitActiveTime();
        sendHeartbeatBeacon(activeDuration.current);
      }
    };

    const handlePageHide = () => {
      commitActiveTime();
      sendHeartbeatBeacon(activeDuration.current);
    };

    const handleTrackedClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;

      const element = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-track]'
      );
      const type = element?.dataset.track;

      if (!element || !type || !eventTypes.has(type)) return;

      trackElementEvent(type as TrackingEventType, element, {
        label: element.dataset.trackLabel?.slice(0, 256) ?? null
      });
    };

    const interval = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('click', handleTrackedClick);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('click', handleTrackedClick);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return null;
}
