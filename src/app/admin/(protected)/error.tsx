'use client';

import {AlertTriangle, RefreshCw} from 'lucide-react';

export default function AdminError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <div className="grid min-h-[65vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-7 text-center">
        <AlertTriangle className="mx-auto size-8 text-red-300" />
        <h1 className="mt-4 text-xl font-semibold">Analytics could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">The dashboard could not reach the data source. Your tracking data has not been changed.</p>
        <button type="button" onClick={reset} className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-medium hover:bg-white/[0.12]"><RefreshCw className="size-4" />Try again</button>
      </div>
    </div>
  );
}
