import type {LucideIcon} from 'lucide-react';

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'amber'
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: 'amber' | 'blue' | 'emerald' | 'violet';
}) {
  const tones = {
    amber: 'border-amber-300/15 bg-amber-400/10 text-amber-300',
    blue: 'border-sky-300/15 bg-sky-400/10 text-sky-300',
    emerald: 'border-emerald-300/15 bg-emerald-400/10 text-emerald-300',
    violet: 'border-violet-300/15 bg-violet-400/10 text-violet-300'
  };
  return (
    <article className="group rounded-2xl border border-white/[0.075] bg-[#0d131e]/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] transition hover:border-white/[0.13] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl border ${tones[tone]}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-[1.7rem] font-semibold leading-none tracking-[-0.04em] text-white">
        {value}
      </p>
      {detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p> : null}
    </article>
  );
}
