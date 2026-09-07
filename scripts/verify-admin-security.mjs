import {chromium} from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error('ADMIN_PASSWORD is required for admin security verification');
}

function sanitizedHeaders(headers, cookie) {
  const next = {...headers};
  for (const name of ['accept-encoding', 'connection', 'content-length', 'host']) {
    delete next[name];
  }

  if (cookie === undefined) delete next.cookie;
  else next.cookie = cookie;
  return next;
}

async function replay(request, cookie) {
  const response = await fetch(request.url(), {
    headers: sanitizedHeaders(await request.allHeaders(), cookie),
    redirect: 'manual'
  });
  return {
    status: response.status,
    location: response.headers.get('location'),
    body: await response.text()
  };
}

function isLoginRedirect(response) {
  return (
    response.location?.includes('/admin/login') ||
    (response.body.includes('/admin/login') &&
      response.body.includes('NEXT_REDIRECT'))
  );
}

const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/admin`, {waitUntil: 'networkidle'});
  if (!page.url().includes('/admin/login')) {
    throw new Error('Unauthenticated full-page admin request was not redirected');
  }

  await page.getByLabel('Password').fill(adminPassword);
  await Promise.all([
    page.waitForURL(`${baseUrl}/admin`),
    page.getByRole('button', {name: 'Sign in'}).click()
  ]);
  await page.getByRole('heading', {name: 'Traffic overview'}).waitFor();

  await page.goto(`${baseUrl}/admin/sessions`, {waitUntil: 'networkidle'});
  const firstSessionLink = await page.locator('tbody a[href^="/admin/sessions/"]').first().getAttribute('href');
  const firstSessionId = firstSessionLink?.split('/').at(-1);
  const firstSessionIp = await page.locator('tbody tr').first().locator('td').nth(2).innerText();
  await page.goto(`${baseUrl}/admin/visitors`, {waitUntil: 'networkidle'});
  const firstVisitorLink = await page.locator('tbody a[href^="/admin/visitors/"]').first().getAttribute('href');
  const firstVisitorId = firstVisitorLink?.split('/').at(-1);
  await page.goto(`${baseUrl}/admin/leads`, {waitUntil: 'networkidle'});
  const firstLeadRow = page.locator('tbody tr').first();
  const firstLeadVin = (await firstLeadRow.locator('td').count()) > 1
    ? await firstLeadRow.locator('td').nth(1).innerText()
    : undefined;

  const protectedPaths = [
    '/admin',
    '/admin/leads',
    '/admin/settings',
    '/admin/sessions',
    '/admin/visitors',
    firstSessionLink,
    firstVisitorLink
  ].filter(Boolean);

  const results = [];
  let capturedSessionRequest;
  for (const path of protectedPaths) {
    await page.goto(`${baseUrl}${path}`, {waitUntil: 'networkidle'});
    const [rscRequest] = await Promise.all([
      page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname === path &&
          request.headers().rsc === '1'
      ),
      page.getByRole('button', {name: 'Refresh', exact: true}).click()
    ]);
    if (path === '/admin/sessions') capturedSessionRequest = rscRequest;

    const unauthenticated = await replay(rscRequest, undefined);
    if (!isLoginRedirect(unauthenticated)) {
      throw new Error(
        `Unauthenticated RSC request was not denied for ${path} (status ${unauthenticated.status})`
      );
    }

    const sensitiveMarkers = path === '/admin/leads'
      ? [firstLeadVin]
      : path === '/admin/sessions'
        ? [firstSessionId, firstSessionIp]
        : path.startsWith('/admin/sessions/')
          ? [firstSessionIp]
          : path === '/admin/visitors'
          ? [firstVisitorId, firstSessionIp]
            : path.startsWith('/admin/visitors/')
              ? [firstSessionId, firstSessionIp]
              : [];
    for (const marker of sensitiveMarkers.filter(Boolean)) {
      if (unauthenticated.body.includes(marker)) {
        throw new Error(`Unauthenticated RSC response exposed ${marker} on ${path}`);
      }
    }

    results.push({path, unauthenticatedStatus: unauthenticated.status});
  }

  if (!capturedSessionRequest) {
    throw new Error('Sessions RSC request was not captured');
  }

  const sessionCookie = (await context.cookies(`${baseUrl}/admin`)).find(
    (cookie) => cookie.name === 'ap_admin_session'
  );
  if (!sessionCookie) throw new Error('Admin session cookie was not created');

  const tamperedCookie = `ap_admin_session=${sessionCookie.value}x`;
  const tampered = await replay(capturedSessionRequest, tamperedCookie);
  if (
    !isLoginRedirect(tampered) ||
    (firstSessionId && tampered.body.includes(firstSessionId))
  ) {
    throw new Error('Tampered admin cookie was accepted by an RSC request');
  }

  await page.goto(`${baseUrl}/admin`, {waitUntil: 'networkidle'});
  await Promise.all([
    page.waitForURL(/\/admin\/login/),
    page.getByRole('button', {name: 'Sign out'}).click()
  ]);

  const remainingAdminCookie = (await context.cookies(`${baseUrl}/admin`)).find(
    (cookie) => cookie.name === 'ap_admin_session'
  );
  if (remainingAdminCookie) {
    throw new Error('Sign out left the path-scoped admin cookie in the browser');
  }

  await page.goto(`${baseUrl}/admin`, {waitUntil: 'networkidle'});
  if (!page.url().includes('/admin/login')) {
    throw new Error('Admin remained accessible after sign out');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        protectedRscPaths: results,
        tamperedCookieStatus: tampered.status,
        logoutCookieRemoved: true,
        postLogoutRedirected: true
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
