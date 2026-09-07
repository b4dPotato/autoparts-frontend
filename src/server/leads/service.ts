import 'server-only';

import type {ContactRequestInput} from '@/lib/contact/contracts';
import {
  runLeadSubmission,
  type TrackingCookies
} from '@/lib/leads/submission';
import {
  getLeadEmailErrorMessage,
  sendLeadEmail
} from './email';
import {
  createLead,
  updateLeadEmailStatus
} from './repository';
import {isLeadEmailNotificationsEnabled} from '@/server/settings/feature-flags';

export async function submitLead(
  input: ContactRequestInput,
  trackingCookies: TrackingCookies
) {
  return runLeadSubmission(input, trackingCookies, {
    createLead,
    isEmailNotificationsEnabled: isLeadEmailNotificationsEnabled,
    sendLeadEmail,
    updateLeadEmailStatus,
    getEmailErrorMessage: getLeadEmailErrorMessage,
    now: () => new Date(),
    reportStatusError: (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Lead email status update failed', error);
      }
    }
  });
}
