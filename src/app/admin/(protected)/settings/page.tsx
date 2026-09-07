import {BellRing, MailCheck, ShieldCheck} from 'lucide-react';
import {PageHeader} from '@/components/admin/page-header';
import {requireAdminSession} from '@/server/admin/auth';
import {isLeadEmailConfigured} from '@/server/leads/email';
import {isLeadEmailNotificationsEnabled} from '@/server/settings/feature-flags';
import {updateLeadEmailNotificationsAction} from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAdminSession();

  const [enabled, emailConfigured] = await Promise.all([
    isLeadEmailNotificationsEnabled(),
    Promise.resolve(isLeadEmailConfigured())
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Owner controls"
        title="Settings"
        description="Persistent application settings stored in Neon. Changes apply to new requests immediately."
        generatedAt={new Date().toISOString()}
      />

      <section className="max-w-3xl rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${enabled ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.05] text-slate-500'}`}>
              <BellRing className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Lead email notifications</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                OFF hides the request form from the public contact dialog. ON shows the form, saves every request to Neon first, and then uses the existing Resend integration for the owner notification.
              </p>
            </div>
          </div>

          <form action={updateLeadEmailNotificationsAction} className="grid grid-cols-2 rounded-xl border border-white/[0.08] bg-black/20 p-1" aria-label="Lead email notifications">
            <button
              type="submit"
              name="enabled"
              value="false"
              disabled={!enabled}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${!enabled ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'}`}
            >
              OFF
            </button>
            <button
              type="submit"
              name="enabled"
              value="true"
              disabled={enabled}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${enabled ? 'bg-emerald-400 text-slate-950' : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'}`}
            >
              ON
            </button>
          </form>
        </div>

        <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${emailConfigured ? 'border-emerald-300/15 bg-emerald-400/[0.055]' : 'border-amber-300/15 bg-amber-400/[0.055]'}`}>
          {emailConfigured ? <MailCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-300" />}
          <div>
            <p className={`text-sm font-medium ${emailConfigured ? 'text-emerald-200' : 'text-amber-200'}`}>
              {emailConfigured ? 'Resend is configured' : 'Email delivery is not configured'}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {emailConfigured
                ? 'Notifications can be enabled safely.'
                : 'Keep the flag off until Resend variables are available. Leads remain saved even if the flag is enabled accidentally.'}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
