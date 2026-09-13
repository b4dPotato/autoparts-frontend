import {describe, expect, it, vi} from 'vitest';
import type {Lead} from '../src/server/db/schema';
import {
  formatLeadEmail,
  formatLeadEmailHtml,
  sendLeadEmail
} from '../src/server/leads/email';

vi.mock('server-only', () => ({}));

const lead: Lead = {
  id: '10000000-0000-4000-8000-000000000001',
  requestNumber: 12,
  visitorId: '20000000-0000-4000-8000-000000000002',
  sessionId: '30000000-0000-4000-8000-000000000003',
  vin: 'WVWZZZ1JZXW000001',
  contactMethod: 'whatsapp',
  contactValue: '+380671234567',
  description: 'Front brake pads',
  locale: 'en',
  pagePath: '/en',
  attributionSource: 'google_ads',
  gclid: 'google-click-id',
  gbraid: null,
  wbraid: null,
  status: 'new',
  emailStatus: 'disabled',
  emailProviderMessageId: null,
  emailError: null,
  emailAttemptedAt: null,
  emailSentAt: null,
  createdAt: new Date('2026-09-06T18:00:00.000Z'),
  updatedAt: new Date('2026-09-06T18:00:00.000Z')
};

describe('lead notification email', () => {
  it('formats the Russian owner message without visitor identifiers', () => {
    const message = formatLeadEmail(lead);

    expect(message).toContain('Заявка №12');
    expect(message).toContain('VIN автомобиля: WVWZZZ1JZXW000001');
    expect(message).not.toContain('Предпочтительный способ связи');
    expect(message).toContain('Источник: Google Ads');
    expect(message).toContain('GCLID: google-click-id');
    expect(message).toContain('06.09.2026 в 21:00 · Киев');
    expect(message).not.toContain(lead.visitorId!);
    expect(message).not.toContain(lead.sessionId!);
  });

  it('renders the screenshot-based HTML layout and escapes lead content', () => {
    const html = formatLeadEmailHtml({
      ...lead,
      description: '<script>alert("x")</script>\nBrake pads'
    });

    expect(html).toContain('Заявка №12');
    expect(html).not.toContain('Качественные запчасти');
    expect(html).not.toContain('для вашего авто');
    expect(html).toContain('class="request-card"');
    expect(html).toContain('border-left:6px solid #d1aa38');
    const fontSizes = [...html.matchAll(/font-size:(\d+)px/g)].map((match) =>
      Number(match[1])
    );
    expect(Math.max(...fontSizes)).toBeLessThanOrEqual(30);
    expect(html.indexOf('Контакт клиента')).toBeLessThan(
      html.indexOf('VIN автомобиля')
    );
    expect(html.indexOf('VIN автомобиля')).toBeLessThan(
      html.indexOf('Что нужно')
    );
    expect(html).not.toContain('Написать в WhatsApp');
    expect(html).not.toContain('https://wa.me/380671234567');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;<br>Brake pads');
    expect(html).not.toContain('<script>alert');
  });

  it('formats Ukrainian phone numbers as a compact clickable value', () => {
    const phoneLead = {
      ...lead,
      contactMethod: 'phone',
      contactValue: '+380972969102'
    } as Lead;
    const html = formatLeadEmailHtml(phoneLead);

    expect(html).toContain('+380 97 296 91 02');
    expect(html).toContain('href="tel:+380972969102"');
    expect(html).not.toContain('Позвонить');
    expect(html).not.toContain('Предпочтительный способ связи');
    expect(formatLeadEmail(phoneLead)).toContain('+380 97 296 91 02');
  });

  it('sends through Resend with environment-based addresses and idempotency', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({id: 'resend-message-id'}, {status: 200})
    ) as unknown as typeof fetch;

    await expect(
      sendLeadEmail(lead, {
        environment: {
          RESEND_API_KEY: 're_test_key',
          LEAD_EMAIL_FROM: 'AutoParts <leads@example.com>',
          LEAD_EMAIL_TO: 'owner@example.com, manager@example.com'
        },
        fetcher
      })
    ).resolves.toEqual({messageId: 'resend-message-id'});

    const [url, options] = vi.mocked(fetcher).mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(new Headers(options?.headers).get('authorization')).toBe(
      'Bearer re_test_key'
    );
    expect(new Headers(options?.headers).get('idempotency-key')).toBe(
      `autoparts-lead-${lead.id}`
    );
    expect(JSON.parse(String(options?.body))).toMatchObject({
      from: 'AutoParts <leads@example.com>',
      to: ['owner@example.com', 'manager@example.com'],
      subject: 'Заявка №12 — AutoParts',
      text: expect.stringContaining('Заявка №12'),
      html: expect.stringContaining('Заявка №12')
    });
  });

  it('fails safely when email credentials are missing', async () => {
    await expect(
      sendLeadEmail(lead, {environment: {}})
    ).rejects.toThrow('Email delivery is not configured');
  });
});
