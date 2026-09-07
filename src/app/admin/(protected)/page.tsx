import {
  BadgePercent,
  Clock3,
  Eye,
  FileText,
  MousePointerClick,
  Phone,
  Send,
  Smartphone,
  Target,
  Timer,
  UserRound,
  UsersRound
} from 'lucide-react';
import {AnalyticsCharts} from '@/components/admin/analytics-charts';
import {formatDuration} from '@/components/admin/format';
import {PageHeader} from '@/components/admin/page-header';
import {StatCard} from '@/components/admin/stat-card';
import {requireAdminSession} from '@/server/admin/auth';
import {parseAdminDateRange, type AdminSearchParams} from '@/server/admin/date-range';
import {getTrackingDashboardData} from '@/server/tracking/repository';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({searchParams}: {searchParams: Promise<AdminSearchParams>}) {
  await requireAdminSession();
  const range = parseAdminDateRange(await searchParams);
  const data = await getTrackingDashboardData({from: range.from, to: range.to});
  const {summary} = data;
  const number = new Intl.NumberFormat('en-GB');
  const generatedAt = new Date().toISOString();

  return (
    <>
      <PageHeader eyebrow={range.label} title="Traffic overview" description="Live first-party acquisition, engagement and contact performance." range={range} basePath="/admin" generatedAt={generatedAt} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Unique visitors" value={number.format(summary.uniqueVisitors)} icon={UserRound} tone="blue" />
        <StatCard label="Total sessions" value={number.format(summary.totalSessions)} icon={UsersRound} />
        <StatCard label="Google Ads sessions" value={number.format(summary.googleAdsSessions)} icon={Target} tone="violet" />
        <StatCard label="Conversion rate" value={`${summary.conversionRate.toFixed(1)}%`} detail={`${number.format(summary.convertedSessions)} contacted sessions`} icon={BadgePercent} tone="emerald" />
        <StatCard label="Average duration" value={formatDuration(summary.averageSessionDurationMs)} icon={Clock3} />
        <StatCard label="Average active time" value={formatDuration(summary.averageActiveDurationMs)} icon={Timer} tone="blue" />
        <StatCard label="Page views" value={number.format(summary.totalPageViews)} icon={Eye} tone="violet" />
        <StatCard label="Contact interactions" value={number.format(summary.contactInteractions)} icon={MousePointerClick} tone="emerald" />
      </section>

      <AnalyticsCharts points={data.trend.points} bucketSize={data.trend.bucketSize} sources={data.sources} contacts={data.contacts} />

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div><h2 className="text-base font-semibold text-white">Contact channels</h2><p className="mt-1 text-xs text-slate-500">Successful requests and direct contact clicks from tracked sessions.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <StatCard label="Form submissions" value={number.format(summary.contactsByType.form_submit)} icon={FileText} tone="emerald" />
          <StatCard label="Phone clicks" value={number.format(summary.contactsByType.phone_click)} icon={Phone} />
          <StatCard label="Telegram clicks" value={number.format(summary.contactsByType.telegram_click)} icon={Send} tone="blue" />
          <StatCard label="Viber clicks" value={number.format(summary.contactsByType.viber_click)} icon={Smartphone} tone="violet" />
          <StatCard label="WhatsApp clicks" value={number.format(summary.contactsByType.whatsapp_click)} icon={Smartphone} tone="emerald" />
        </div>
      </section>
    </>
  );
}
