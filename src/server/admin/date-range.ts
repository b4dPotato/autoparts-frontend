export type AdminSearchParams = Record<string, string | string[] | undefined>;

export type AdminDateRange = {
  from?: Date;
  to?: Date;
  key: '24h' | '7d' | '30d' | '90d' | 'all' | 'custom';
  label: string;
  fromInput: string;
  toInput: string;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseInputDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function inputValue(date: Date | undefined) {
  return date?.toISOString().slice(0, 10) ?? '';
}

export function parseAdminDateRange(
  searchParams: AdminSearchParams,
  now = new Date()
): AdminDateRange {
  const customFrom = parseInputDate(one(searchParams.from));
  const customTo = parseInputDate(one(searchParams.to), true);

  if (customFrom || customTo) {
    return {
      from: customFrom,
      to: customTo,
      key: 'custom',
      label: 'Custom range',
      fromInput: inputValue(customFrom),
      toInput: inputValue(customTo)
    };
  }

  const requested = one(searchParams.range);
  const key =
    requested === '24h' ||
    requested === '7d' ||
    requested === '90d' ||
    requested === 'all'
      ? requested
      : '30d';

  if (key === 'all') {
    return {
      key,
      label: 'All time',
      fromInput: '',
      toInput: ''
    };
  }

  const hours = key === '24h' ? 24 : Number.parseInt(key, 10) * 24;
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

  return {
    from,
    to: now,
    key,
    label: key === '24h' ? 'Last 24 hours' : `Last ${Number.parseInt(key, 10)} days`,
    fromInput: inputValue(from),
    toInput: inputValue(now)
  };
}
