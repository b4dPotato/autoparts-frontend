import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  MailCheck
} from 'lucide-react';
import {formatAdminDate} from '@/components/admin/format';
import {PageHeader} from '@/components/admin/page-header';
import {StatCard} from '@/components/admin/stat-card';
import {requireAdminSession} from '@/server/admin/auth';
import {parseAdminDateRange, type AdminSearchParams} from '@/server/admin/date-range';
import type {Lead} from '@/server/db/schema';
import {getLeadDashboardData} from '@/server/leads/repository';

export const dynamic = 'force-dynamic';

function describeSource(lead: Lead) {
  if (lead.gclid || lead.gbraid || lead.wbraid) return 'Google Ads';
  if (lead.attributionSource === 'utm') return 'Campaign';
  if (lead.attributionSource === 'referral') return 'Referral';
  return 'Direct';
}

function emailBadge(lead: Lead) {
  if (lead.emailStatus === 'sent') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="size-3.5" />Sent
      </span>
    );
  }

  if (lead.emailStatus === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-300"
        title={lead.emailError ?? undefined}
      >
        <AlertCircle className="size-3.5" />Failed
      </span>
    );
  }

  if (lead.emailStatus === 'disabled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-400/10 px-2.5 py-1 text-xs font-medium text-slate-400">
        <Clock3 className="size-3.5" />Disabled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
      <Clock3 className="size-3.5" />Pending
    </span>
  );
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requireAdminSession();
  const range = parseAdminDateRange(await searchParams);
  const data = await getLeadDashboardData({from: range.from, to: range.to});
  const number = new Intl.NumberFormat('en-GB');

  return (
    <>
      <PageHeader
        eyebrow={range.label}
        title="Leads"
        description="Contact form requests, attribution and email delivery status. The newest 100 requests are shown below."
        range={range}
        basePath="/admin/leads"
        generatedAt={new Date().toISOString()}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Requests" value={number.format(data.summary.total)} icon={Inbox} />
        <StatCard label="New" value={number.format(data.summary.newLeads)} icon={Clock3} tone="blue" />
        <StatCard label="Emails sent" value={number.format(data.summary.emailsSent)} icon={MailCheck} tone="emerald" />
        <StatCard label="Email failures" value={number.format(data.summary.emailsFailed)} icon={AlertCircle} tone="violet" />
      </section>

      <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-white/[0.075] bg-white/[0.025] text-xs uppercase tracking-[0.08em] text-slate-600">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Received</th>
                <th className="px-4 py-3.5 font-semibold">VIN</th>
                <th className="px-4 py-3.5 font-semibold">Contact</th>
                <th className="px-4 py-3.5 font-semibold">Description</th>
                <th className="px-4 py-3.5 font-semibold">Source</th>
                <th className="px-4 py-3.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.055]">
              {data.items.map((lead) => (
                <tr key={lead.id} className="align-top transition hover:bg-white/[0.025]">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                    {formatAdminDate(lead.createdAt)}
                    {lead.sessionId ? (
                      <p className="mt-1">
                        <Link className="text-xs text-sky-300/80 hover:text-sky-200" href={`/admin/sessions/${lead.sessionId}`}>
                          View session
                        </Link>
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs font-medium text-white">{lead.vin}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{lead.contactValue}</p>
                    <p className="mt-1 text-xs capitalize text-slate-600">{lead.contactMethod}</p>
                  </td>
                  <td className="max-w-80 px-4 py-4 text-slate-400">
                    <p className="line-clamp-3 whitespace-pre-wrap" title={lead.description ?? undefined}>
                      {lead.description || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-lg bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-slate-300">
                      {describeSource(lead)}
                    </span>
                    {lead.gclid ? <p className="mt-1 max-w-44 truncate text-xs text-slate-600" title={lead.gclid}>GCLID · {lead.gclid}</p> : null}
                  </td>
                  <td className="px-4 py-4">{emailBadge(lead)}</td>
                </tr>
              ))}
              {!data.items.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="font-medium text-slate-400">No leads found</p>
                    <p className="mt-1 text-xs text-slate-600">New contact form requests will appear here.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
