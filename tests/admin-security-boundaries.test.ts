import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {afterAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {createAdminSessionToken} from '../src/server/admin/session-token';

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  cookies: vi.fn(),
  redirect: vi.fn()
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({cookies: mocks.cookies}));
vi.mock('next/navigation', () => ({redirect: mocks.redirect}));

import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_PATH,
  clearAdminSession,
  requireAdminSession
} from '../src/server/admin/auth';

const originalPassword = process.env.ADMIN_PASSWORD;
const originalSecret = process.env.ADMIN_SESSION_SECRET;
const secret = 'test-admin-session-secret-with-more-than-thirty-two-characters';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.ADMIN_SESSION_SECRET = secret;
  mocks.cookies.mockResolvedValue({
    get: mocks.cookieGet,
    set: mocks.cookieSet
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });
});

afterAll(() => {
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;

  if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = originalSecret;
});

describe('admin authorization boundary', () => {
  it('redirects before protected data can be read without a session', async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(requireAdminSession()).rejects.toThrow(
      'redirect:/admin/login'
    );
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');
  });

  it('allows an intact, unexpired admin session', async () => {
    const token = createAdminSessionToken(secret);
    mocks.cookieGet.mockReturnValue({name: ADMIN_COOKIE_NAME, value: token});

    await expect(requireAdminSession()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('guards every sensitive admin Server Component before its data read', () => {
    const entryPoints = [
      ['src/app/admin/(protected)/page.tsx', 'getTrackingDashboardData('],
      ['src/app/admin/(protected)/leads/page.tsx', 'getLeadDashboardData('],
      ['src/app/admin/(protected)/settings/page.tsx', 'isLeadEmailNotificationsEnabled('],
      ['src/app/admin/(protected)/sessions/page.tsx', 'getSessions('],
      ['src/app/admin/(protected)/sessions/[id]/page.tsx', 'getSessionById('],
      ['src/app/admin/(protected)/visitors/page.tsx', 'getVisitors('],
      ['src/app/admin/(protected)/visitors/[id]/page.tsx', 'getVisitorById(']
    ] as const;

    for (const [relativePath, dataRead] of entryPoints) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
      const guardIndex = source.indexOf('await requireAdminSession()');
      const dataReadIndex = source.indexOf(dataRead, source.indexOf('export default'));

      expect(guardIndex, `${relativePath} is missing its admin guard`).toBeGreaterThan(-1);
      expect(dataReadIndex, `${relativePath} is missing its data read`).toBeGreaterThan(-1);
      expect(guardIndex, `${relativePath} reads data before authenticating`).toBeLessThan(
        dataReadIndex
      );
    }
  });

  it('re-authorizes the feature-flag Server Action before mutation', () => {
    const relativePath = 'src/app/admin/(protected)/settings/actions.ts';
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
    const guardIndex = source.indexOf('await requireAdminSession()');
    const mutationIndex = source.indexOf('await setLeadEmailNotificationsEnabled(');

    expect(guardIndex).toBeGreaterThan(-1);
    expect(mutationIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(mutationIndex);
  });
});

describe('admin logout cookie', () => {
  it('expires the same path-scoped cookie that login creates', async () => {
    await clearAdminSession();

    expect(mocks.cookieSet).toHaveBeenCalledWith(
      ADMIN_COOKIE_NAME,
      '',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: ADMIN_COOKIE_PATH,
        maxAge: 0
      })
    );
  });
});
