import type {ContactRequestInput} from '@/lib/contact/contracts';
import type {Lead} from '@/server/db/schema';

export type TrackingCookies = {
  sessionId?: string;
  visitorId?: string;
};

export type LeadEmailStatus = 'disabled' | 'sent' | 'failed';

export type LeadSubmissionDependencies = {
  createLead: (
    input: ContactRequestInput,
    trackingCookies: TrackingCookies
  ) => Promise<Lead>;
  isEmailNotificationsEnabled: () => Promise<boolean>;
  sendLeadEmail: (lead: Lead) => Promise<{messageId: string}>;
  updateLeadEmailStatus: (
    leadId: string,
    update:
      | {status: 'sent'; messageId: string; attemptedAt: Date; sentAt: Date}
      | {status: 'failed'; error: string; attemptedAt: Date}
  ) => Promise<void>;
  getEmailErrorMessage: (error: unknown) => string;
  now: () => Date;
  reportStatusError: (error: unknown) => void;
};

export async function runLeadSubmission(
  input: ContactRequestInput,
  trackingCookies: TrackingCookies,
  dependencies: LeadSubmissionDependencies
): Promise<{lead: Lead; emailStatus: LeadEmailStatus}> {
  // Persistence intentionally comes first so email outages cannot lose a lead.
  const lead = await dependencies.createLead(input, trackingCookies);

  let emailNotificationsEnabled = false;
  try {
    emailNotificationsEnabled =
      await dependencies.isEmailNotificationsEnabled();
  } catch (error) {
    dependencies.reportStatusError(error);
  }

  if (!emailNotificationsEnabled) {
    return {lead, emailStatus: 'disabled'};
  }

  const attemptedAt = dependencies.now();
  let emailStatus: LeadEmailStatus = 'disabled';

  try {
    const delivery = await dependencies.sendLeadEmail(lead);

    try {
      await dependencies.updateLeadEmailStatus(lead.id, {
        status: 'sent',
        messageId: delivery.messageId,
        attemptedAt,
        sentAt: dependencies.now()
      });
      emailStatus = 'sent';
    } catch (error) {
      dependencies.reportStatusError(error);
    }
  } catch (error) {
    try {
      await dependencies.updateLeadEmailStatus(lead.id, {
        status: 'failed',
        error: dependencies.getEmailErrorMessage(error),
        attemptedAt
      });
      emailStatus = 'failed';
    } catch (statusError) {
      dependencies.reportStatusError(statusError);
    }
  }

  return {lead, emailStatus};
}
