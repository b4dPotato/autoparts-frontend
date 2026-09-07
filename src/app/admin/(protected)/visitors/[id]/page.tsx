import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft, Clock3, Eye, Globe2, MapPin, MessagesSquare, Target, UsersRound} from 'lucide-react';
import {describeTrafficSource, formatAdminDate, formatDuration} from '@/components/admin/format';
import {PageHeader} from '@/components/admin/page-header';
import {StatCard} from '@/components/admin/stat-card';
import {requireAdminSession} from '@/server/admin/auth';
import {getVisitorById} from '@/server/tracking/repository';

export const dynamic = 'force-dynamic';

export default async function VisitorDetailPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminSession();
  const {id} = await params;
  const result = await getVisitorById(id);
  if (!result) notFound();
  const {visitor, summary, ipHistory, sessions} = result;
  return (
    <>
      <PageHeader eyebrow="Visitor profile" title="Visitor history" description={visitor.id} generatedAt={new Date().toISOString()} actions={<Link href="/admin/visitors" className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-medium text-slate-300 hover:bg-white/[0.07]"><ArrowLeft className="size-3.5" />Visitors</Link>} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions" value={summary.sessionCount} icon={UsersRound} />
        <StatCard label="Page views" value={summary.pageViews} icon={Eye} tone="blue" />
        <StatCard label="Average duration" value={formatDuration(summary.averageDurationMs)} icon={Clock3} tone="violet" />
        <StatCard label="Contacted sessions" value={summary.convertedSessions} icon={MessagesSquare} tone="emerald" />
      </section>
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,.72fr)]">
        <section className="rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><MapPin className="size-4" /></span><div><h2 className="font-semibold">IP address history</h2><p className="mt-0.5 text-xs text-slate-500">Observed across this visitor’s sessions.</p></div></div><div className="mt-4 space-y-2">{ipHistory.map((item) => <div key={item.ip} className="grid gap-2 rounded-xl border border-white/[0.065] bg-black/15 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><span className="font-mono text-sm text-sky-300">{item.ip}</span><span className="text-xs text-slate-500">{item.sessionCount} session{item.sessionCount === 1 ? '' : 's'}</span><span className="text-xs text-slate-500">Last {formatAdminDate(item.lastSeenAt)}</span></div>)}{!ipHistory.length ? <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-slate-600">No IP address was available.</div> : null}</div></section>
        <section className="rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-5"><h2 className="font-semibold">Profile summary</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-slate-500">First seen</dt><dd className="text-right text-slate-300">{formatAdminDate(visitor.createdAt)}</dd></div><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-slate-500">Last seen</dt><dd className="text-right text-slate-300">{formatAdminDate(visitor.lastSeenAt)}</dd></div><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-slate-500">Total active time</dt><dd className="text-slate-300">{formatDuration(summary.activeDurationMs)}</dd></div><div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-slate-500"><Target className="size-3.5" />Google Ads sessions</dt><dd className="text-slate-300">{summary.googleAdsSessions}</dd></div></dl></section>
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0d131e]/90"><div className="flex items-center gap-3 border-b border-white/[0.075] p-5"><Globe2 className="size-4 text-amber-300" /><div><h2 className="font-semibold">Session history</h2><p className="mt-0.5 text-xs text-slate-500">Up to the 100 most recent sessions.</p></div></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="border-b border-white/[0.075] bg-white/[0.025] text-xs uppercase tracking-[0.08em] text-slate-600"><tr><th className="px-4 py-3 font-semibold">Started</th><th className="px-4 py-3 font-semibold">IP</th><th className="px-4 py-3 font-semibold">Source</th><th className="px-4 py-3 font-semibold">Duration</th><th className="px-4 py-3 font-semibold">Events</th><th className="px-4 py-3 font-semibold">Contact</th></tr></thead><tbody className="divide-y divide-white/[0.055]">{sessions.map((session) => <tr key={session.id} className="hover:bg-white/[0.025]"><td className="px-4 py-3.5"><Link href={`/admin/sessions/${session.id}`} className="font-medium text-white hover:text-amber-300">{formatAdminDate(session.startedAt)}</Link></td><td className="px-4 py-3.5 font-mono text-xs text-sky-300/80">{session.ip ?? '—'}</td><td className="px-4 py-3.5 text-slate-300">{describeTrafficSource(session)}</td><td className="px-4 py-3.5 text-slate-300">{formatDuration(session.durationMs)}</td><td className="px-4 py-3.5 text-slate-300">{session.eventCount}</td><td className={`px-4 py-3.5 text-xs ${session.converted ? 'text-emerald-300' : 'text-slate-600'}`}>{session.converted ? session.conversionType?.replace('_click', '') ?? 'Yes' : 'No'}</td></tr>)}</tbody></table></div></section>
    </>
  );
}
