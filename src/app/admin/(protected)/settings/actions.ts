'use server';

import {revalidatePath} from 'next/cache';
import {requireAdminSession} from '@/server/admin/auth';
import {setLeadEmailNotificationsEnabled} from '@/server/settings/feature-flags';

export async function updateLeadEmailNotificationsAction(formData: FormData) {
  await requireAdminSession();

  const value = formData.get('enabled');
  if (value !== 'true' && value !== 'false') {
    throw new Error('Invalid feature flag value');
  }

  await setLeadEmailNotificationsEnabled(value === 'true');
  revalidatePath('/admin/settings');
  revalidatePath('/[locale]', 'page');
}
