import Link from 'next/link';
import {ArrowLeft, ArrowRight, CheckCircle2, CircleUserRound, Globe2, XCircle} from 'lucide-react';
import {formatAdminDate, formatDuration} from '@/components/admin/format';
import {ListFilters} from '@/components/admin/list-filters';
import {PageHeader} from '@/components/admin/page-header';
import {requireAdminSession} from '@/server/admin/auth';
import {parseAdminDateRange, type AdminSearchParams} from '@/server/admin/date-range';
import {getVisitors, type TrafficSourceFilter} from '@/server/tracking/repository';

export const dynamic = 'force-dynamic';

function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function sourceValue(value: string | undefined): TrafficSourceFilter | undefined { return value === 'ads' || value === 'utm' || value === 'referral' || value === 'direct' ? value : undefined; }
function pageUrl(parameters: AdminSearchParams, cursor: string, direction: 'after' | 'before') {
  const next = new URLSearchParams();
  for (const key of ['range', 'from', 'to', 'q', 'source', 'contacted']) { const value = one(parameters[key]); if (value) next.set(key, value); }
  next.set(direction, cursor);
  return `/admin/visitors?${next}`;
}

export default async function VisitorsPage({searchParams}: {searchParams: Promise<AdminSearchParams>}) {
  await requireAdminSession();
  const parameters = await searchParams;
  const range = parseAdminDateRange(parameters);
  const query = one(parameters.q)?.trim().slice(0, 255);
  const source = sourceValue(one(parameters.source));
  const contactedValue = one(parameters.contacted);
  const contacted = contactedValue === 'yes' ? true : contactedValue === 'no' ? false : undefined;
  const result = await getVisitors({from: range.from, to: range.to, query, source, contacted}, {after: one(parameters.after), before: one(parameters.before), pageSize: 25});
  return (
    <>
      <PageHeader eyebrow={range.label} title="Visitors" description={`${result.total.toLocaleString('en-GB')} people match the current view, grouped across their sessions and IP addresses.`} range={range} basePath="/admin/visitors" generatedAt={new Date().toISOString()} />
      <ListFilters range={range} basePath="/admin/visitors" query={query} source={source} contacted={contactedValue} />
      <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-white/[0.075] bg-white/[0.025] text-xs uppercase tracking-[0.08em] text-slate-600"><tr><th className="px-4 py-3.5 font-semibold">Visitor</th><th className="px-4 py-3.5 font-semibold">First / last visit</th><th className="px-4 py-3.5 font-semibold">Last IP</th><th className="px-4 py-3.5 font-semibold">Sessions</th><th className="px-4 py-3.5 font-semibold">Active time</th><th className="px-4 py-3.5 font-semibold">Acquisition</th><th className="px-4 py-3.5 font-semibold">Contact</th></tr></thead>
            <tbody className="divide-y divide-white/[0.055]">
              {result.items.map((visitor) => <tr key={visitor.id} className="transition hover:bg-white/[0.025]">
                <td className="px-4 py-4"><Link href={`/admin/visitors/${visitor.id}`} className="flex items-center gap-2.5 font-medium text-white hover:text-amber-300"><span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-slate-400"><CircleUserRound className="size-4" /></span><span className="max-w-36 truncate font-mono text-xs">{visitor.id}</span></Link></td>
                <td className="whitespace-nowrap px-4 py-4 text-xs"><p className="text-slate-300">{formatAdminDate(visitor.firstSeenAt)}</p><p className="mt-1 text-slate-600">{formatAdminDate(visitor.lastSeenAt)}</p></td>
                <td className="px-4 py-4"><p className="font-mono text-xs text-sky-300/80">{visitor.lastIp ?? 'Unavailable'}</p><p className="mt-1 text-xs text-slate-600">{visitor.distinctIpCount} distinct IP{visitor.distinctIpCount === 1 ? '' : 's'}</p></td>
                <td className="px-4 py-4 font-medium text-slate-200">{visitor.sessionCount}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatDuration(visitor.activeDurationMs)}</td>
                <td className="px-4 py-4">{visitor.googleAdsSessions ? <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-300"><Globe2 className="size-3.5" />{visitor.googleAdsSessions} Ads</span> : <span className="text-xs text-slate-600">Non-Ads</span>}</td>
                <td className="px-4 py-4">{visitor.convertedSessions ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300"><CheckCircle2 className="size-3.5" />{visitor.convertedSessions} session{visitor.convertedSessions === 1 ? '' : 's'}</span> : <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><XCircle className="size-3.5" />No</span>}</td>
              </tr>)}
              {!result.items.length ? <tr><td colSpan={7} className="px-4 py-16 text-center"><p className="font-medium text-slate-400">No visitors found</p><p className="mt-1 text-xs text-slate-600">Try a wider date range or clear the filters.</p></td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Visitor pages">
        {result.previousCursor ? <Link href={pageUrl(parameters, result.previousCursor, 'before')} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-slate-300 hover:bg-white/[0.07]"><ArrowLeft className="size-4" />Previous</Link> : <span />}
        <span className="text-xs text-slate-600">Showing {result.items.length} of {result.total.toLocaleString('en-GB')}</span>
        {result.nextCursor ? <Link href={pageUrl(parameters, result.nextCursor, 'after')} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-slate-300 hover:bg-white/[0.07]">Next<ArrowRight className="size-4" /></Link> : <span />}
      </nav>
    </>
  );
}
