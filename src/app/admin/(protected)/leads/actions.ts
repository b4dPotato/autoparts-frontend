'use server';

import 'server-only';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireAdminSession} from '@/server/admin/auth';
import {deleteLeadById} from '@/server/leads/repository';

const leadIdSchema = z.string().uuid();

export async function deleteLeadAction(untrustedLeadId: string) {
  await requireAdminSession();

  const leadId = leadIdSchema.safeParse(untrustedLeadId);
  if (!leadId.success) {
    throw new Error('Invalid lead identifier');
  }

  await deleteLeadById(leadId.data);
  revalidatePath('/admin/leads');
}
