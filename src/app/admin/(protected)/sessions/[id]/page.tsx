import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {LucideIcon} from 'lucide-react';
import {ArrowLeft, CheckCircle2, Clock3, ExternalLink, Eye, FileText, Globe2, Languages, MapPin, MousePointerClick, Navigation, Radio, Target, UserRound} from 'lucide-react';
import {describeTrafficSource, formatAdminDate, formatDuration, formatElapsed} from '@/components/admin/format';
import {PageHeader} from '@/components/admin/page-header';
import {requireAdminSession} from '@/server/admin/auth';
import {getSessionById} from '@/server/tracking/repository';

export const dynamic = 'force-dynamic';

function Detail({label, value, icon: Icon}: {label: string; value: React.ReactNode; icon: LucideIcon}) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-600"><Icon className="size-3.5" />{label}</dt><dd className="mt-2 break-words text-sm leading-6 text-slate-200">{value || '—'}</dd></div>;
}

function eventPresentation(type: string): {label: string; icon: LucideIcon; tone: string} {
  if (type === 'page_view') return {label: 'Page view', icon: Eye, tone: 'bg-sky-400/10 text-sky-300'};
  if (type.includes('_click')) return {label: type.replaceAll('_', ' '), icon: MousePointerClick, tone: 'bg-emerald-400/10 text-emerald-300'};
  if (type.includes('navigation')) return {label: 'Navigation', icon: Navigation, tone: 'bg-violet-400/10 text-violet-300'};
  return {label: type.replaceAll('_', ' '), icon: Radio, tone: 'bg-amber-400/10 text-amber-300'};
}

export default async function SessionDetailPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminSession();
  const {id} = await params;
  const result = await getSessionById(id);
  if (!result) notFound();
  const {session, events} = result;
  return (
    <>
      <PageHeader eyebrow={formatAdminDate(session.startedAt)} title="Session detail" description={session.id} generatedAt={new Date().toISOString()} actions={<Link href="/admin/sessions" className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-medium text-slate-300 hover:bg-white/[0.07]"><ArrowLeft className="size-3.5" />Sessions</Link>} />

      <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-4 ${session.converted ? 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-200' : 'border-white/[0.075] bg-[#0d131e]/90 text-slate-400'}`}>
        {session.converted ? <CheckCircle2 className="size-5" /> : <Radio className="size-5" />}<div><p className="text-sm font-semibold">{session.converted ? `Contacted via ${session.conversionType?.replace('_click', '') ?? 'tracked channel'}` : 'No contact interaction'}</p><p className="mt-0.5 text-xs opacity-70">{session.eventCount} events · {session.pageViews} page views · {formatDuration(session.activeDurationMs)} active</p></div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Visitor" icon={UserRound} value={<Link href={`/admin/visitors/${session.visitorId}`} className="font-mono text-xs text-amber-300 hover:underline">{session.visitorId}</Link>} />
        <Detail label="IP address" icon={MapPin} value={<span className="font-mono text-sky-300">{session.ip ?? 'Unavailable'}</span>} />
        <Detail label="Traffic source" icon={Globe2} value={describeTrafficSource(session)} />
        <Detail label="Landing page" icon={FileText} value={session.landingPage} />
        <Detail label="Started" icon={Clock3} value={formatAdminDate(session.startedAt)} />
        <Detail label="Last activity" icon={Clock3} value={formatAdminDate(session.lastActivityAt)} />
        <Detail label="Elapsed duration" icon={Clock3} value={formatDuration(session.durationMs)} />
        <Detail label="Active duration" icon={Radio} value={formatDuration(session.activeDurationMs)} />
        <Detail label="Page views" icon={Eye} value={session.pageViews} />
        <Detail label="Tracked clicks" icon={MousePointerClick} value={session.clickCount} />
        <Detail label="All events" icon={Radio} value={session.eventCount} />
        <Detail label="Referrer" icon={ExternalLink} value={session.referrer} />
        <Detail label="GCLID" icon={Target} value={session.gclid} />
        <Detail label="GBRAID" icon={Target} value={session.gbraid} />
        <Detail label="WBRAID" icon={Target} value={session.wbraid} />
        <Detail label="UTM" icon={Target} value={[session.utmSource, session.utmMedium, session.utmCampaign, session.utmTerm, session.utmContent].filter(Boolean).join(' / ')} />
      </dl>

      <section className="mt-6 rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-5"><h2 className="text-base font-semibold">Request information</h2><dl className="mt-4 grid gap-3 xl:grid-cols-2"><Detail label="User-Agent" icon={Globe2} value={session.userAgent} /><Detail label="Accept-Language" icon={Languages} value={session.acceptLanguage} /></dl></section>

      <section className="mt-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold">Activity timeline</h2><p className="mt-1 text-xs text-slate-500">Chronological first-party events and interaction targets.</p></div><span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-slate-500">{events.length} events</span></div><div className="relative mt-4 space-y-3 before:absolute before:bottom-6 before:left-[1.15rem] before:top-6 before:w-px before:bg-white/[0.08]">{events.map((event) => { const presentation = eventPresentation(event.type); const Icon = presentation.icon; return <article key={event.id} className="relative grid gap-3 rounded-2xl border border-white/[0.07] bg-[#0d131e]/90 p-4 pl-14 sm:grid-cols-[8rem_1fr] sm:items-start"><span className={`absolute left-3 top-4 z-10 grid size-7 place-items-center rounded-lg ${presentation.tone}`}><Icon className="size-3.5" /></span><div><p className="text-xs font-semibold capitalize text-slate-300">{presentation.label}</p><time className="mt-1 block text-xs text-slate-600">{formatElapsed(event.createdAt, session.startedAt)} · {formatAdminDate(event.createdAt)}</time></div><div className="min-w-0 text-sm text-slate-300"><p className="break-all">{event.path}{event.targetText ? ` · ${event.targetText}` : ''}</p>{event.targetHref ? <p className="mt-1 break-all text-xs text-slate-600">{event.targetHref}</p> : null}{event.metadata ? <pre className="mt-2 overflow-x-auto rounded-lg bg-black/20 p-2 text-xs text-slate-500">{JSON.stringify(event.metadata, null, 2)}</pre> : null}</div></article>;})}{!events.length ? <div className="rounded-2xl border border-dashed border-white/[0.08] p-10 text-center text-sm text-slate-600">No recorded events.</div> : null}</div></section>
    </>
  );
}
