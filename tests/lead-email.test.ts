import {describe, expect, it, vi} from 'vitest';
import type {Lead} from '../src/server/db/schema';
import {
  formatLeadEmail,
  sendLeadEmail
} from '../src/server/leads/email';

vi.mock('server-only', () => ({}));

const lead: Lead = {
  id: '10000000-0000-4000-8000-000000000001',
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
  it('formats the lead and its attribution without visitor identifiers', () => {
    const message = formatLeadEmail(lead);

    expect(message).toContain('VIN: WVWZZZ1JZXW000001');
    expect(message).toContain('Preferred contact: WhatsApp');
    expect(message).toContain('Source: Google Ads');
    expect(message).toContain('GCLID: google-click-id');
    expect(message).toContain('Date: 2026-09-06T18:00:00.000Z');
    expect(message).not.toContain(lead.visitorId!);
    expect(message).not.toContain(lead.sessionId!);
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
      subject: 'New request from AutoParts'
    });
  });

  it('fails safely when email credentials are missing', async () => {
    await expect(
      sendLeadEmail(lead, {environment: {}})
    ).rejects.toThrow('Email delivery is not configured');
  });
});
