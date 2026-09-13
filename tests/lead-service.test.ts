import {describe, expect, it, vi} from 'vitest';
import type {ContactRequestInput} from '../src/lib/contact/contracts';
import {runLeadSubmission} from '../src/lib/leads/submission';
import type {Lead} from '../src/server/db/schema';
import {sendLeadEmail} from '../src/server/leads/email';

vi.mock('server-only', () => ({}));

const input: ContactRequestInput = {
  vin: 'WVWZZZ1JZXW000001',
  preferredContact: 'phone',
  contactValue: '+380671234567',
  description: null,
  locale: 'en',
  path: '/en'
};

const lead: Lead = {
  id: '10000000-0000-4000-8000-000000000001',
  requestNumber: 12,
  visitorId: null,
  sessionId: null,
  vin: input.vin,
  contactMethod: input.preferredContact,
  contactValue: input.contactValue,
  description: input.description,
  locale: input.locale,
  pagePath: input.path,
  attributionSource: 'direct',
  gclid: null,
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

describe('lead submission flow', () => {
  it('saves the lead before sending email and records delivery success', async () => {
    const calls: string[] = [];
    const updateLeadEmailStatus = vi.fn(async () => {
      calls.push('update:sent');
    });

    const result = await runLeadSubmission(input, {}, {
      createLead: async () => {
        calls.push('save');
        return lead;
      },
      isEmailNotificationsEnabled: async () => true,
      sendLeadEmail: async () => {
        calls.push('email');
        return {messageId: 'message-id'};
      },
      updateLeadEmailStatus,
      getEmailErrorMessage: () => 'Email delivery failed',
      now: () => new Date('2026-09-06T18:00:01.000Z'),
      reportStatusError: vi.fn()
    });

    expect(calls).toEqual(['save', 'email', 'update:sent']);
    expect(result).toEqual({lead, emailStatus: 'sent'});
    expect(updateLeadEmailStatus).toHaveBeenCalledWith(
      lead.id,
      expect.objectContaining({status: 'sent', messageId: 'message-id'})
    );
  });

  it('keeps the saved lead and records failure when email delivery fails', async () => {
    const calls: string[] = [];
    const updateLeadEmailStatus = vi.fn(async (_id, update) => {
      calls.push(`update:${update.status}`);
    });

    const result = await runLeadSubmission(input, {}, {
      createLead: async () => {
        calls.push('save');
        return lead;
      },
      isEmailNotificationsEnabled: async () => true,
      sendLeadEmail: async () => {
        calls.push('email');
        throw new Error('temporary provider outage');
      },
      updateLeadEmailStatus,
      getEmailErrorMessage: () => 'Email delivery failed',
      now: () => new Date('2026-09-06T18:00:01.000Z'),
      reportStatusError: vi.fn()
    });

    expect(calls).toEqual(['save', 'email', 'update:failed']);
    expect(result).toEqual({lead, emailStatus: 'failed'});
    expect(updateLeadEmailStatus).toHaveBeenCalledWith(
      lead.id,
      expect.objectContaining({
        status: 'failed',
        error: 'Email delivery failed'
      })
    );
  });

  it('saves the lead and does not attempt email when notifications are off', async () => {
    const calls: string[] = [];
    const sendLeadEmail = vi.fn();

    const result = await runLeadSubmission(input, {}, {
      createLead: async () => {
        calls.push('save');
        return lead;
      },
      isEmailNotificationsEnabled: async () => {
        calls.push('flag:off');
        return false;
      },
      sendLeadEmail,
      updateLeadEmailStatus: vi.fn(),
      getEmailErrorMessage: () => 'Email delivery failed',
      now: () => new Date('2026-09-06T18:00:01.000Z'),
      reportStatusError: vi.fn()
    });

    expect(calls).toEqual(['save', 'flag:off']);
    expect(sendLeadEmail).not.toHaveBeenCalled();
    expect(result).toEqual({lead, emailStatus: 'disabled'});
  });

  it('fails closed after saving when the flag cannot be read', async () => {
    const sendLeadEmail = vi.fn();
    const reportStatusError = vi.fn();

    const result = await runLeadSubmission(input, {}, {
      createLead: async () => lead,
      isEmailNotificationsEnabled: async () => {
        throw new Error('settings unavailable');
      },
      sendLeadEmail,
      updateLeadEmailStatus: vi.fn(),
      getEmailErrorMessage: () => 'Email delivery failed',
      now: () => new Date('2026-09-06T18:00:01.000Z'),
      reportStatusError
    });

    expect(sendLeadEmail).not.toHaveBeenCalled();
    expect(reportStatusError).toHaveBeenCalledOnce();
    expect(result).toEqual({lead, emailStatus: 'disabled'});
  });

  it('keeps the saved lead when notifications are on but Resend is missing', async () => {
    const updateLeadEmailStatus = vi.fn();

    const result = await runLeadSubmission(input, {}, {
      createLead: async () => lead,
      isEmailNotificationsEnabled: async () => true,
      sendLeadEmail: (savedLead) =>
        sendLeadEmail(savedLead, {environment: {}}),
      updateLeadEmailStatus,
      getEmailErrorMessage: (error) =>
        error instanceof Error ? error.message : 'Email delivery failed',
      now: () => new Date('2026-09-06T18:00:01.000Z'),
      reportStatusError: vi.fn()
    });

    expect(result).toEqual({lead, emailStatus: 'failed'});
    expect(updateLeadEmailStatus).toHaveBeenCalledWith(
      lead.id,
      expect.objectContaining({
        status: 'failed',
        error: 'Email delivery is not configured'
      })
    );
  });
});
