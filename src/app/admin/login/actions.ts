'use server';

import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {setAdminSession, verifyAdminPassword} from '@/server/admin/auth';
import {
  canAttemptAdminLogin,
  clearAdminLoginFailures,
  recordFailedAdminLogin
} from '@/server/admin/rate-limit';

function loginKey(requestHeaders: Headers) {
  const forwarded =
    requestHeaders.get('x-vercel-forwarded-for') ??
    requestHeaders.get('x-forwarded-for') ??
    requestHeaders.get('x-real-ip') ??
    'unknown';
  return forwarded.split(',')[0]!.trim().slice(0, 64);
}

export async function loginAction(formData: FormData) {
  const requestHeaders = await headers();
  const key = loginKey(requestHeaders);

  if (!canAttemptAdminLogin(key)) {
    redirect('/admin/login?error=rate-limited');
  }

  const supplied = formData.get('password');
  const password = typeof supplied === 'string' ? supplied.slice(0, 1024) : '';

  if (!verifyAdminPassword(password)) {
    recordFailedAdminLogin(key);
    redirect('/admin/login?error=invalid');
  }

  clearAdminLoginFailures(key);
  await setAdminSession();
  redirect('/admin');
}
