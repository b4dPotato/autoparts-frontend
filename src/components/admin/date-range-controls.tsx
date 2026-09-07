import Link from 'next/link';
import {CalendarDays} from 'lucide-react';
import type {AdminDateRange} from '@/server/admin/date-range';

const presets = [
  ['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days'],
  ['90d', '90 days'], ['all', 'All time']
] as const;

export function DateRangeControls({range, basePath}: {range: AdminDateRange; basePath: string}) {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.075] bg-[#0d131e]/80 p-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        <CalendarDays className="ml-1 hidden size-4 shrink-0 text-slate-500 sm:block" aria-hidden="true" />
        {presets.map(([key, label]) => (
          <Link key={key} href={`${basePath}?range=${key}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${range.key === key ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>
            {label}
          </Link>
        ))}
      </div>
      <form method="get" action={basePath} className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium text-slate-500">From
          <input type="date" name="from" required defaultValue={range.key === 'custom' ? range.fromInput : ''} className="mt-1 block h-9 rounded-lg border border-white/[0.09] bg-[#080d15] px-2.5 text-sm text-slate-300 outline-none transition focus:border-amber-300/40" />
        </label>
        <label className="text-xs font-medium text-slate-500">To
          <input type="date" name="to" required defaultValue={range.key === 'custom' ? range.toInput : ''} className="mt-1 block h-9 rounded-lg border border-white/[0.09] bg-[#080d15] px-2.5 text-sm text-slate-300 outline-none transition focus:border-amber-300/40" />
        </label>
        <button className="h-9 rounded-lg border border-amber-300/25 bg-amber-400/[0.07] px-3 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15">Apply</button>
      </form>
    </div>
  );
}
