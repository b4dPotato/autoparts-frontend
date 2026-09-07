'use client';

import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition} from 'react';
import {Pause, Play, RefreshCw, WifiOff} from 'lucide-react';

const REFRESH_SECONDS = 15;

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function AutoRefresh({generatedAt}: {generatedAt: string}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const [seconds, setSeconds] = useState(REFRESH_SECONDS);
  const [pending, startTransition] = useTransition();
  const pendingRef = useRef(false);
  const secondsRef = useRef(REFRESH_SECONDS);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const refresh = useCallback(() => {
    if (pendingRef.current || !navigator.onLine) return;
    pendingRef.current = true;
    secondsRef.current = REFRESH_SECONDS;
    setSeconds(REFRESH_SECONDS);
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!enabled || !online) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      secondsRef.current -= 1;
      if (secondsRef.current <= 0) refresh();
      else setSeconds(secondsRef.current);
    }, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, online, refresh]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    secondsRef.current = REFRESH_SECONDS;
    setSeconds(REFRESH_SECONDS);
  }

  const updatedLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Kyiv'
  }).format(new Date(generatedAt));

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-slate-400">
        {!online ? (
          <WifiOff className="size-3.5 text-red-300" aria-hidden="true" />
        ) : (
          <span className={`size-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        )}
        <span>{!online ? 'Offline' : enabled ? `Live · ${seconds}s` : 'Live paused'}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="grid size-9 place-items-center rounded-lg border border-white/[0.08] bg-black/20 text-slate-400 transition hover:border-white/15 hover:text-white"
        aria-label={enabled ? 'Pause automatic refresh' : 'Resume automatic refresh'}
      >
        {enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={refresh}
        disabled={pending || !online}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-slate-300 transition hover:border-amber-300/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
        Refresh
      </button>
      <span className="hidden text-slate-600 xl:inline">Updated {updatedLabel} Kyiv</span>
    </div>
  );
}
