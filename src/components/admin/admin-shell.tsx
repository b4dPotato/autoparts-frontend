'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState, useSyncExternalStore} from 'react';
import {
  Activity,
  CarFront,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X
} from 'lucide-react';
import {logoutAction} from '@/app/admin/(protected)/actions';

const navigation = [
  {href: '/admin', label: 'Overview', icon: LayoutDashboard},
  {href: '/admin/leads', label: 'Leads', icon: Inbox},
  {href: '/admin/visitors', label: 'Visitors', icon: Users},
  {href: '/admin/sessions', label: 'Sessions', icon: Activity},
  {href: '/admin/settings', label: 'Settings', icon: Settings}
] as const;

function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia('(min-width: 1024px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function AdminShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true
  );

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {desktop || open ? <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-white/[0.08] bg-[#0b1019]/98 shadow-2xl shadow-black/30 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.08] px-5">
          <div className="grid size-10 place-items-center rounded-xl border border-amber-300/20 bg-amber-400/10 text-amber-300">
            <CarFront className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">AutoParts Ukraine</p>
            <p className="mt-0.5 text-xs text-slate-500">Analytics workspace</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Admin navigation">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            Workspace
          </p>
          {navigation.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20'
                    : 'text-slate-400 hover:bg-white/[0.055] hover:text-white'
                }`}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {item.label}
                {active ? <span className="ml-auto size-1.5 rounded-full bg-slate-950/60" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-400/[0.06] px-3 py-2.5 text-xs text-emerald-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Neon connected
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-400/10 hover:text-red-200"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside> : null}

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/[0.07] bg-[#070b12]/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <p className="ml-3 text-sm font-semibold">Analytics</p>
        </header>
        <main className="min-h-screen bg-[radial-gradient(circle_at_72%_-10%,rgba(245,158,11,0.09),transparent_28%),linear-gradient(180deg,#080d15_0%,#070b12_65%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="mx-auto max-w-[96rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
