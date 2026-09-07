import type {Session} from '@/server/db/schema';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Kyiv'
});

export function formatAdminDate(
  value: Date | string | null | undefined,
  now = new Date()
) {
  if (!value) return '—';
  const date = new Date(value);
  const elapsedSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (elapsedSeconds >= 0 && elapsedSeconds < 5 * 60) {
    if (elapsedSeconds < 60) {
      return `${elapsedSeconds} second${elapsedSeconds === 1 ? '' : 's'} ago`;
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  return dateFormatter.format(date);
}

export function formatDuration(milliseconds: number | null | undefined) {
  if (!milliseconds || milliseconds < 1000) return '0s';
  const seconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [
    hours ? `${hours}h` : '',
    minutes ? `${minutes}m` : '',
    remainingSeconds || (!hours && !minutes) ? `${remainingSeconds}s` : ''
  ]
    .filter(Boolean)
    .join(' ');
}

export function formatElapsed(value: Date | string, start: Date | string) {
  const elapsed = Math.max(0, new Date(value).getTime() - new Date(start).getTime());
  return `+${formatDuration(elapsed)}`;
}

export function describeTrafficSource(session: Session) {
  if (session.gclid || session.gbraid || session.wbraid) return 'Google Ads';
  if (session.utmSource) {
    return [session.utmSource, session.utmMedium].filter(Boolean).join(' / ');
  }
  if (session.referrer) {
    try {
      return new URL(session.referrer).hostname;
    } catch {
      return 'Referral';
    }
  }
  return 'Direct';
}
