import {redirect} from 'next/navigation';
import {isAdminAuthenticated, isAdminConfigured} from '@/server/admin/auth';
import {loginAction} from './actions';

export const dynamic = 'force-dynamic';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({searchParams}: LoginPageProps) {
  if (await isAdminAuthenticated()) redirect('/admin');

  const parameters = await searchParams;
  const error = Array.isArray(parameters.error)
    ? parameters.error[0]
    : parameters.error;
  const configured = isAdminConfigured();
  const message =
    error === 'rate-limited'
      ? 'Too many attempts. Try again in 15 minutes.'
      : error === 'invalid'
        ? 'Incorrect password.'
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-2xl shadow-black/40 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          AutoParts Ukraine
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Enter the private owner password to view first-party traffic data.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Admin access is not configured. Set <code>ADMIN_PASSWORD</code> and a
            32+ character <code>ADMIN_SESSION_SECRET</code> on the server.
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            {message}
          </div>
        ) : null}

        <form action={loginAction} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured}
              maxLength={1024}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <button
            type="submit"
            disabled={!configured}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
