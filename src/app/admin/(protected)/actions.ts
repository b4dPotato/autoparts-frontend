'use server';

import {redirect} from 'next/navigation';
import {clearAdminSession} from '@/server/admin/auth';

export async function logoutAction() {
  await clearAdminSession();
  redirect('/admin/login');
}
