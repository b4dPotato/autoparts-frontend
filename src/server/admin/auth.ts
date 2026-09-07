import 'server-only';

import {createHash, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken
} from './session-token';

export const ADMIN_COOKIE_NAME = 'ap_admin_session';
export const ADMIN_COOKIE_PATH = '/admin';

function getAdminConfiguration() {
  const password = process.env.ADMIN_PASSWORD ?? '';
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';

  return {
    password,
    secret,
    valid: password.length >= 12 && secret.length >= 32
  };
}

export function isAdminConfigured() {
  return getAdminConfiguration().valid;
}

export function verifyAdminPassword(candidate: string) {
  const configuration = getAdminConfiguration();
  if (!configuration.valid) return false;

  const expected = createHash('sha256')
    .update(configuration.password)
    .digest();
  const supplied = createHash('sha256').update(candidate).digest();
  return timingSafeEqual(expected, supplied);
}

export async function isAdminAuthenticated() {
  const configuration = getAdminConfiguration();
  if (!configuration.valid) return false;

  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    configuration.secret
  );
}

export async function requireAdminSession() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}

export async function setAdminSession() {
  const configuration = getAdminConfiguration();
  if (!configuration.valid) {
    throw new Error('Admin authentication is not configured');
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_COOKIE_NAME,
    createAdminSessionToken(configuration.secret),
    {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: ADMIN_COOKIE_PATH,
      maxAge: ADMIN_SESSION_TTL_SECONDS
    }
  );
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: ADMIN_COOKIE_PATH,
    expires: new Date(0),
    maxAge: 0
  });
}
