'use client';

import {Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Activity, Megaphone, MousePointerClick, TrendingUp} from 'lucide-react';

type TrendPoint = {bucket: string; sessions: number; visitors: number; pageViews: number; contacts: number};
const palette = ['#f5b942', '#38bdf8', '#a78bfa', '#34d399'];
const tooltipStyle = {background: '#0b111b', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', boxShadow: '0 18px 50px rgba(0,0,0,.35)', color: '#e2e8f0', fontSize: '12px'};

function labelForBucket(value: string, bucketSize: string) {
  const options: Intl.DateTimeFormatOptions = bucketSize === 'hour' ? {day: '2-digit', month: 'short', hour: '2-digit'} : bucketSize === 'month' ? {month: 'short', year: '2-digit'} : {day: '2-digit', month: 'short'};
  return new Intl.DateTimeFormat('en-GB', {...options, timeZone: 'Europe/Kyiv'}).format(new Date(value));
}

function ChartCard({title, description, icon: Icon, children}: {title: string; description: string; icon: typeof Activity; children: React.ReactNode}) {
  return <section className="rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-5"><div className="mb-5 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-amber-300"><Icon className="size-4" aria-hidden="true" /></span><div><h2 className="text-base font-semibold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>{children}</section>;
}

function EmptyChart() {
  return <div className="grid h-[270px] place-items-center rounded-xl border border-dashed border-white/[0.08] text-sm text-slate-600">No data in this period</div>;
}

export function AnalyticsCharts({points, bucketSize, sources, contacts}: {points: TrendPoint[]; bucketSize: string; sources: Array<{name: string; value: number}>; contacts: Array<{name: string; value: number}>}) {
  const trend = points.map((point) => ({...point, label: labelForBucket(point.bucket, bucketSize)}));
  const contactTotal = contacts.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <ChartCard title="Traffic trend" description="Unique visitors and sessions across the selected period." icon={TrendingUp}>
        {!trend.length ? <EmptyChart /> : <div className="h-[270px]" role="img" aria-label="Visitors and sessions trend chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{left: -18, right: 6, top: 6}}><defs><linearGradient id="sessions-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5b942" stopOpacity={0.32} /><stop offset="100%" stopColor="#f5b942" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.09)" vertical={false} /><XAxis dataKey="label" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} minTickGap={24} /><YAxis allowDecimals={false} tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{fontSize: 12, color: '#94a3b8'}} /><Area type="monotone" dataKey="sessions" name="Sessions" stroke="#f5b942" strokeWidth={2} fill="url(#sessions-fill)" /><Area type="monotone" dataKey="visitors" name="Visitors" stroke="#38bdf8" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div>}
      </ChartCard>
      <ChartCard title="Engagement & conversion" description="Page-view volume compared with sessions that produced a contact." icon={MousePointerClick}>
        {!trend.length ? <EmptyChart /> : <div className="h-[270px]" role="img" aria-label="Page views and contacts chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{left: -18, right: 6, top: 6}}><CartesianGrid stroke="rgba(148,163,184,.09)" vertical={false} /><XAxis dataKey="label" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} minTickGap={24} /><YAxis allowDecimals={false} tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,.025)'}} /><Legend wrapperStyle={{fontSize: 12, color: '#94a3b8'}} /><Bar dataKey="pageViews" name="Page views" fill="#38bdf8" radius={[5, 5, 0, 0]} /><Bar dataKey="contacts" name="Converted sessions" fill="#34d399" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>}
      </ChartCard>
      <ChartCard title="Traffic sources" description="Session mix by acquisition category." icon={Megaphone}>
        {!sources.length ? <EmptyChart /> : <div className="h-[270px]" role="img" aria-label="Traffic sources distribution chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">{sources.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{fontSize: 12, color: '#94a3b8'}} /></PieChart></ResponsiveContainer></div>}
      </ChartCard>
      <ChartCard title="Contact channels" description={`${contactTotal.toLocaleString('en-GB')} recorded contact interactions.`} icon={Activity}>
        {!contactTotal ? <EmptyChart /> : <div className="h-[270px]" role="img" aria-label="Contact channel distribution chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={contacts} layout="vertical" margin={{left: 2, right: 12, top: 4}}><CartesianGrid stroke="rgba(148,163,184,.09)" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" width={78} tick={{fill: '#94a3b8', fontSize: 11}} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,.025)'}} /><Bar dataKey="value" name="Clicks" fill="#f5b942" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>}
      </ChartCard>
    </div>
  );
}
