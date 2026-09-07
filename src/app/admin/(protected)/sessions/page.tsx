import Link from 'next/link';
import {ArrowLeft, ArrowRight, CheckCircle2, MousePointerClick, XCircle} from 'lucide-react';
import {describeTrafficSource, formatAdminDate, formatDuration} from '@/components/admin/format';
import {ListFilters} from '@/components/admin/list-filters';
import {PageHeader} from '@/components/admin/page-header';
import {requireAdminSession} from '@/server/admin/auth';
import {parseAdminDateRange, type AdminSearchParams} from '@/server/admin/date-range';
import {getSessions, type TrafficSourceFilter} from '@/server/tracking/repository';

export const dynamic = 'force-dynamic';

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sourceValue(value: string | undefined): TrafficSourceFilter | undefined {
  return value === 'ads' || value === 'utm' || value === 'referral' || value === 'direct' ? value : undefined;
}

function pageUrl(parameters: AdminSearchParams, cursor: string, direction: 'after' | 'before') {
  const next = new URLSearchParams();
  for (const key of ['range', 'from', 'to', 'q', 'source', 'contacted', 'sort']) {
    const value = one(parameters[key]);
    if (value) next.set(key, value);
  }
  next.set(direction, cursor);
  return `/admin/sessions?${next}`;
}

export default async function SessionsPage({searchParams}: {searchParams: Promise<AdminSearchParams>}) {
  await requireAdminSession();
  const parameters = await searchParams;
  const range = parseAdminDateRange(parameters);
  const query = one(parameters.q)?.trim().slice(0, 255);
  const source = sourceValue(one(parameters.source));
  const contactedValue = one(parameters.contacted);
  const contacted = contactedValue === 'yes' ? true : contactedValue === 'no' ? false : undefined;
  const sort = one(parameters.sort) === 'oldest' ? 'oldest' : 'newest';
  const result = await getSessions(
    {from: range.from, to: range.to, query, source, contacted},
    {after: one(parameters.after), before: one(parameters.before), pageSize: 25, sort}
  );

  return (
    <>
      <PageHeader eyebrow={range.label} title="Sessions" description={`${result.total.toLocaleString('en-GB')} visits match the current view.`} range={range} basePath="/admin/sessions" generatedAt={new Date().toISOString()} />
      <ListFilters range={range} basePath="/admin/sessions" query={query} source={source} contacted={contactedValue} sort={sort} includeSort />

      <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-white/[0.075] bg-white/[0.025] text-xs uppercase tracking-[0.08em] text-slate-600">
              <tr><th className="px-4 py-3.5 font-semibold">Started</th><th className="px-4 py-3.5 font-semibold">Source</th><th className="px-4 py-3.5 font-semibold">IP address</th><th className="px-4 py-3.5 font-semibold">Duration</th><th className="px-4 py-3.5 font-semibold">Active</th><th className="px-4 py-3.5 font-semibold">Events</th><th className="px-4 py-3.5 font-semibold">Contact</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.055]">
              {result.items.map((session) => (
                <tr key={session.id} className="transition hover:bg-white/[0.025]">
                  <td className="whitespace-nowrap px-4 py-4"><Link href={`/admin/sessions/${session.id}`} className="font-medium text-white transition hover:text-amber-300">{formatAdminDate(session.startedAt)}</Link><p className="mt-1 max-w-32 truncate font-mono text-xs text-slate-600">{session.id}</p></td>
                  <td className="px-4 py-4"><span className="inline-flex rounded-lg bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-slate-300">{describeTrafficSource(session)}</span>{session.gclid ? <p className="mt-1 max-w-40 truncate text-xs text-slate-600" title={session.gclid}>GCLID · {session.gclid}</p> : null}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-sky-300/80">{session.ip ?? 'Unavailable'}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatDuration(session.durationMs)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatDuration(session.activeDurationMs)}</td>
                  <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-slate-300"><MousePointerClick className="size-3.5 text-slate-600" />{session.eventCount}</span></td>
                  <td className="px-4 py-4">{session.converted ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300"><CheckCircle2 className="size-3.5" />{session.conversionType?.replace('_click', '') ?? 'Yes'}</span> : <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><XCircle className="size-3.5" />No</span>}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={7} className="px-4 py-16 text-center"><p className="font-medium text-slate-400">No sessions found</p><p className="mt-1 text-xs text-slate-600">Try a wider date range or clear the filters.</p></td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Session pages">
        {result.previousCursor ? <Link href={pageUrl(parameters, result.previousCursor, 'before')} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-slate-300 hover:bg-white/[0.07]"><ArrowLeft className="size-4" />Previous</Link> : <span />}
        <span className="text-xs text-slate-600">Showing {result.items.length} of {result.total.toLocaleString('en-GB')}</span>
        {result.nextCursor ? <Link href={pageUrl(parameters, result.nextCursor, 'after')} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-slate-300 hover:bg-white/[0.07]">Next<ArrowRight className="size-4" /></Link> : <span />}
      </nav>
    </>
  );
}
