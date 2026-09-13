import 'server-only';

import type {Lead} from '@/server/db/schema';

const RESEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails';
const BRAND_URL = 'https://autoparts.in.ua';
const KYIV_TIME_ZONE = 'Europe/Kyiv';

const EMAIL_TOKENS = {
  color: {
    canvas: '#f4f3f0',
    surface: '#ffffff',
    surfaceMuted: '#fbfaf7',
    field: '#f4f5f6',
    text: '#111111',
    heading: '#050505',
    muted: '#747d8d',
    border: '#e1e4e8',
    fieldBorder: '#d9dde2',
    accent: '#d1aa38'
  },
  space: {xs: 4, sm: 8, md: 12, lg: 16, xl: 24},
  radius: {sm: 4, md: 6},
  type: {
    small: {size: 13, line: 18},
    meta: {size: 14, line: 20},
    body: {size: 16, line: 22},
    emphasis: {size: 18, line: 24},
    title: {size: 30, line: 36}
  }
} as const;

function emailTextStyle(
  type: keyof typeof EMAIL_TOKENS.type,
  color: keyof typeof EMAIL_TOKENS.color,
  weight: 400 | 600 = 400
) {
  const typography = EMAIL_TOKENS.type[type];
  return `font-family:Arial,Helvetica,sans-serif;font-size:${typography.size}px;font-weight:${weight};line-height:${typography.line}px;color:${EMAIL_TOKENS.color[color]};`;
}

const EMAIL_STYLES = {
  brand: emailTextStyle('title', 'heading', 600),
  title: emailTextStyle('title', 'heading', 600),
  sectionTitle: emailTextStyle('emphasis', 'heading', 600),
  emphasizedValue: emailTextStyle('emphasis', 'text', 600),
  body: emailTextStyle('body', 'text'),
  label: emailTextStyle('meta', 'muted'),
  meta: emailTextStyle('meta', 'muted'),
  small: emailTextStyle('small', 'muted')
} as const;

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  LEAD_EMAIL_FROM?: string;
  LEAD_EMAIL_TO?: string;
};

type Fetcher = typeof fetch;

export class LeadEmailError extends Error {}

function sourceLabel(source: string) {
  return {
    google_ads: 'Google Ads',
    utm: 'Рекламная кампания',
    referral: 'Переход с другого сайта',
    direct: 'Прямой переход'
  }[source] ?? source;
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatKyivDate(date: Date) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: KYIV_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('day')}.${value('month')}.${value('year')} в ${value('hour')}:${value('minute')} · Киев`;
}

function formatPhoneNumber(contactValue: string) {
  const digits = contactValue.replace(/\D/g, '');

  if (!digits.startsWith('380') || digits.length <= 3) {
    return contactValue.trim();
  }

  let remaining = digits.slice(3);
  const groups: string[] = [];
  const firstGroupLength = Math.min(2, remaining.length);
  groups.push(remaining.slice(0, firstGroupLength));
  remaining = remaining.slice(firstGroupLength);

  if (remaining.length) {
    const secondGroupLength = Math.min(3, remaining.length);
    groups.push(remaining.slice(0, secondGroupLength));
    remaining = remaining.slice(secondGroupLength);
  }

  while (remaining.length) {
    groups.push(remaining.slice(0, 2));
    remaining = remaining.slice(2);
  }

  return `+380 ${groups.join(' ')}`;
}

function formatContactValue(contactMethod: string, contactValue: string) {
  return contactMethod === 'phone'
    ? formatPhoneNumber(contactValue)
    : contactValue;
}

export function formatLeadEmail(lead: Lead) {
  return [
    `Заявка №${lead.requestNumber}`,
    formatKyivDate(lead.createdAt),
    '',
    'Контакт клиента',
    formatContactValue(lead.contactMethod, lead.contactValue),
    '',
    `VIN автомобиля: ${lead.vin}`,
    '',
    'Что нужно',
    lead.description || 'Описание не указано',
    '',
    'Детали заявки',
    `Источник: ${sourceLabel(lead.attributionSource)}`,
    `GCLID: ${lead.gclid || '—'}`,
    `GBRAID: ${lead.gbraid || '—'}`,
    `WBRAID: ${lead.wbraid || '—'}`,
    '',
    `Заявка поступила через форму на ${BRAND_URL.replace('https://', '')}`
  ].join('\n');
}

export function formatLeadEmailHtml(lead: Lead) {
  const description = escapeHtml(lead.description || 'Описание не указано').replace(
    /\r?\n/g,
    '<br>'
  );
  const displayedContact = formatContactValue(
    lead.contactMethod,
    lead.contactValue
  );
  const contactMarkup =
    lead.contactMethod === 'phone'
      ? `<a href="tel:+${lead.contactValue.replace(/\D/g, '')}" style="color:${EMAIL_TOKENS.color.text};text-decoration:none;">${escapeHtml(displayedContact)}</a>`
      : escapeHtml(displayedContact);

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light only">
    <title>Заявка №${escapeHtml(lead.requestNumber)}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-shell { padding: 4px 3px !important; }
        .email-content { padding: 16px 12px !important; }
        .request-card { padding: 12px !important; }
        .vin-value { letter-spacing: .7px !important; }
        .detail-label, .detail-value { display: block !important; width: 100% !important; }
        .detail-value { padding-top: 4px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_TOKENS.color.canvas};color:${EMAIL_TOKENS.color.heading};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:${EMAIL_TOKENS.color.canvas};">
      <tr>
        <td class="email-shell" align="center" style="padding:${EMAIL_TOKENS.space.lg}px ${EMAIL_TOKENS.space.sm}px;">
          <table class="email-card" role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:700px;background:${EMAIL_TOKENS.color.surface};border-radius:${EMAIL_TOKENS.radius.md}px;box-shadow:0 12px 38px rgba(54,48,35,.08);">
            <tr>
              <td class="email-content" style="padding:${EMAIL_TOKENS.space.xl}px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="top" style="width:100%;">
                      <div class="brand-title" style="${EMAIL_STYLES.brand}letter-spacing:-.8px;">AutoParts</div>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:${EMAIL_TOKENS.space.xs}px;"><tr><td style="width:31px;height:6px;background:${EMAIL_TOKENS.color.accent};font-size:0;line-height:0;">&nbsp;</td><td style="padding-left:${EMAIL_TOKENS.space.sm}px;${EMAIL_STYLES.meta}">autoparts.in.ua</td></tr></table>
                    </td>
                  </tr>
                </table>

                <div class="request-title" style="margin-top:${EMAIL_TOKENS.space.xl}px;${EMAIL_STYLES.title}letter-spacing:-.6px;">Заявка №${escapeHtml(lead.requestNumber)}</div>
                <div style="margin-top:${EMAIL_TOKENS.space.xs}px;${EMAIL_STYLES.meta}">${escapeHtml(formatKyivDate(lead.createdAt))}</div>

                <div style="height:1px;margin:${EMAIL_TOKENS.space.lg}px 0;background:${EMAIL_TOKENS.color.border};font-size:0;line-height:0;">&nbsp;</div>

                <div style="${EMAIL_STYLES.label}">Контакт клиента</div>
                <div class="contact-value" style="margin-top:${EMAIL_TOKENS.space.xs}px;${EMAIL_STYLES.emphasizedValue}word-break:break-word;">${contactMarkup}</div>

                <div style="margin-top:${EMAIL_TOKENS.space.md}px;${EMAIL_STYLES.label}">VIN автомобиля</div>
                <div class="vin-value" style="margin-top:${EMAIL_TOKENS.space.xs}px;padding:${EMAIL_TOKENS.space.sm}px ${EMAIL_TOKENS.space.md}px;border:1px solid ${EMAIL_TOKENS.color.fieldBorder};border-radius:${EMAIL_TOKENS.radius.sm}px;background:${EMAIL_TOKENS.color.field};${EMAIL_STYLES.body}letter-spacing:1px;word-break:break-all;">${escapeHtml(lead.vin)}</div>

                <div class="request-card" style="margin-top:${EMAIL_TOKENS.space.lg}px;padding:${EMAIL_TOKENS.space.md}px ${EMAIL_TOKENS.space.lg}px;border-left:6px solid ${EMAIL_TOKENS.color.accent};border-radius:${EMAIL_TOKENS.radius.md}px;background:${EMAIL_TOKENS.color.surfaceMuted};">
                  <div style="${EMAIL_STYLES.label}">Что нужно</div>
                  <div style="margin-top:${EMAIL_TOKENS.space.xs}px;${EMAIL_STYLES.body}">${description}</div>
                </div>

                <div style="height:1px;margin:${EMAIL_TOKENS.space.lg}px 0;background:${EMAIL_TOKENS.color.border};font-size:0;line-height:0;">&nbsp;</div>

                <div style="${EMAIL_STYLES.sectionTitle}">Детали заявки</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:${EMAIL_TOKENS.space.sm}px;">
                  <tr>
                    <td class="detail-label" style="width:49%;${EMAIL_STYLES.label}">Источник</td>
                    <td class="detail-value" style="${EMAIL_STYLES.body}">${escapeHtml(sourceLabel(lead.attributionSource))}</td>
                  </tr>
                </table>

                <div style="height:1px;margin:${EMAIL_TOKENS.space.md}px 0;background:${EMAIL_TOKENS.color.border};font-size:0;line-height:0;">&nbsp;</div>
                <div style="${EMAIL_STYLES.small}">Заявка поступила через форму на <a href="${BRAND_URL}" style="color:${EMAIL_TOKENS.color.muted};text-decoration:none;">autoparts.in.ua</a></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
      subject: `Заявка №${lead.requestNumber} — AutoParts`,
      text: formatLeadEmail(lead),
      html: formatLeadEmailHtml(lead)
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
