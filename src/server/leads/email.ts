import 'server-only';

import type {Lead} from '@/server/db/schema';

const RESEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails';

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  LEAD_EMAIL_FROM?: string;
  LEAD_EMAIL_TO?: string;
};

type Fetcher = typeof fetch;

export class LeadEmailError extends Error {}

function contactMethodLabel(method: string) {
  return {
    phone: 'Phone',
    telegram: 'Telegram',
    viber: 'Viber',
    whatsapp: 'WhatsApp'
  }[method] ?? method;
}

function sourceLabel(source: string) {
  return {
    google_ads: 'Google Ads',
    utm: 'UTM campaign',
    referral: 'Referral',
    direct: 'Direct'
  }[source] ?? source;
}

export function formatLeadEmail(lead: Lead) {
  return [
    'New request from AutoParts',
    '',
    `VIN: ${lead.vin}`,
    `Preferred contact: ${contactMethodLabel(lead.contactMethod)}`,
    `Contact: ${lead.contactValue}`,
    `Description: ${lead.description || '—'}`,
    '',
    `Source: ${sourceLabel(lead.attributionSource)}`,
    `GCLID: ${lead.gclid || '—'}`,
    `GBRAID: ${lead.gbraid || '—'}`,
    `WBRAID: ${lead.wbraid || '—'}`,
    `Date: ${lead.createdAt.toISOString()}`
  ].join('\n');
}

function getEmailConfig(environment: EmailEnvironment) {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.LEAD_EMAIL_FROM?.trim();
  const to = environment.LEAD_EMAIL_TO?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!apiKey || !from || !to?.length) {
    throw new LeadEmailError('Email delivery is not configured');
  }

  return {apiKey, from, to};
}

export function isLeadEmailConfigured(
  environment: EmailEnvironment = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEAD_EMAIL_FROM: process.env.LEAD_EMAIL_FROM,
    LEAD_EMAIL_TO: process.env.LEAD_EMAIL_TO
  }
) {
  try {
    getEmailConfig(environment);
    return true;
  } catch {
    return false;
  }
}

export async function sendLeadEmail(
  lead: Lead,
  options: {environment?: EmailEnvironment; fetcher?: Fetcher} = {}
) {
  const environment = options.environment ?? {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEAD_EMAIL_FROM: process.env.LEAD_EMAIL_FROM,
    LEAD_EMAIL_TO: process.env.LEAD_EMAIL_TO
  };
  const {apiKey, from, to} = getEmailConfig(environment);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(RESEND_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'idempotency-key': `autoparts-lead-${lead.id}`,
      'user-agent': 'AutoParts-Lead-Notifier/1.0'
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'New request from AutoParts',
      text: formatLeadEmail(lead)
    }),
    signal: AbortSignal.timeout(10_000)
  });

  const result = (await response.json().catch(() => null)) as
    | {id?: unknown}
    | null;

  if (!response.ok || typeof result?.id !== 'string') {
    throw new LeadEmailError(`Email provider returned HTTP ${response.status}`);
  }

  return {messageId: result.id};
}

export function getLeadEmailErrorMessage(error: unknown) {
  if (error instanceof LeadEmailError) return error.message;
  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'Email provider timed out';
  }
  return 'Email delivery failed';
}
