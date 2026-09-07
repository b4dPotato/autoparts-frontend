import type {ReactNode} from 'react';
import type {AdminDateRange} from '@/server/admin/date-range';
import {AutoRefresh} from './auto-refresh';
import {DateRangeControls} from './date-range-controls';

export function PageHeader({
  eyebrow,
  title,
  description,
  range,
  basePath,
  generatedAt = new Date().toISOString(),
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  range?: AdminDateRange;
  basePath?: string;
  generatedAt?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-amber-400">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <AutoRefresh generatedAt={generatedAt} />
        </div>
      </div>
      {range && basePath ? <DateRangeControls range={range} basePath={basePath} /> : null}
    </header>
  );
}
