import {Filter, Search} from 'lucide-react';
import type {AdminDateRange} from '@/server/admin/date-range';

export function ListFilters({range, basePath, query, source, contacted, sort, includeSort = false}: {
  range: AdminDateRange; basePath: string; query?: string; source?: string;
  contacted?: string; sort?: string; includeSort?: boolean;
}) {
  const idPrefix = basePath.replaceAll('/', '-');
  return (
    <form action={basePath} method="get" className={`mb-4 grid gap-3 rounded-2xl border border-white/[0.075] bg-[#0d131e]/80 p-3 ${includeSort ? 'md:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,auto))_auto]' : 'md:grid-cols-[minmax(14rem,1fr)_repeat(2,minmax(9rem,auto))_auto]'}`}>
      {range.key === 'custom' ? <><input type="hidden" name="from" value={range.fromInput} /><input type="hidden" name="to" value={range.toInput} /></> : <input type="hidden" name="range" value={range.key} />}
      <label className="relative"><span className="sr-only">Search</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><input type="search" name="q" defaultValue={query} placeholder="IP, visitor ID, GCLID or source" maxLength={255} className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#080d15] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/40" /></label>
      <label className="sr-only" htmlFor={`${idPrefix}-source`}>Traffic source</label>
      <select id={`${idPrefix}-source`} name="source" defaultValue={source ?? ''} className="h-10 rounded-xl border border-white/[0.09] bg-[#080d15] px-3 text-sm text-slate-300 outline-none focus:border-amber-300/40"><option value="">All sources</option><option value="ads">Google Ads</option><option value="utm">UTM campaigns</option><option value="referral">Referral</option><option value="direct">Direct</option></select>
      <label className="sr-only" htmlFor={`${idPrefix}-contacted`}>Contact status</label>
      <select id={`${idPrefix}-contacted`} name="contacted" defaultValue={contacted ?? ''} className="h-10 rounded-xl border border-white/[0.09] bg-[#080d15] px-3 text-sm text-slate-300 outline-none focus:border-amber-300/40"><option value="">All contact status</option><option value="yes">Contacted</option><option value="no">Not contacted</option></select>
      {includeSort ? <><label className="sr-only" htmlFor={`${idPrefix}-sort`}>Sort order</label><select id={`${idPrefix}-sort`} name="sort" defaultValue={sort ?? 'newest'} className="h-10 rounded-xl border border-white/[0.09] bg-[#080d15] px-3 text-sm text-slate-300 outline-none focus:border-amber-300/40"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></> : null}
      <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.11]"><Filter className="size-4" aria-hidden="true" />Filter</button>
    </form>
  );
}
