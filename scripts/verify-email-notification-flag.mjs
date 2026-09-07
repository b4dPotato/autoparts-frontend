import {chromium} from '@playwright/test';
import {neon} from '@neondatabase/serverless';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const adminPassword = process.env.ADMIN_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;
const flagName = 'leadEmailNotifications';

if (!adminPassword || !databaseUrl) {
  throw new Error('ADMIN_PASSWORD and DATABASE_URL are required');
}

const sql = neon(databaseUrl);
const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext();
const page = await context.newPage();
const publicPage = await context.newPage();
let initialEnabled = false;
let testLeadId;

async function readFlag() {
  const rows = await sql.query(
    'select enabled from feature_flags where name = $1',
    [flagName]
  );
  return rows[0]?.enabled ?? false;
}

async function clickFlag(value, captureRequest = false) {
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      typeof request.headers()['next-action'] === 'string'
  );
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      typeof response.request().headers()['next-action'] === 'string'
  );

  await page.getByRole('button', {name: value ? 'ON' : 'OFF', exact: true}).click();
  const [request, response] = await Promise.all([requestPromise, responsePromise]);
  if (!response.ok()) {
    throw new Error(`Feature flag action failed with HTTP ${response.status()}`);
  }
  await page.reload({waitUntil: 'networkidle'});
  return captureRequest ? request : undefined;
}

async function assertLeadFormVisibility(expected) {
  await publicPage.goto(`${baseUrl}/uk`, {waitUntil: 'networkidle'});
  await publicPage.locator('.cta-pulse-glow').first().click();

  const formVisible = await publicPage
    .locator('#contact-request-form')
    .isVisible()
    .catch(() => false);
  if (formVisible !== expected) {
    throw new Error(
      `Lead form visibility was ${formVisible}; expected ${expected}`
    );
  }

  const phoneVisible = await publicPage
    .getByRole('link', {name: /телефон/i})
    .isVisible();
  if (!phoneVisible) {
    throw new Error('Direct contact channels disappeared with the lead form');
  }
}

async function replayWithoutCookie(request) {
  const headers = {...(await request.allHeaders())};
  for (const name of [
    'accept-encoding',
    'connection',
    'content-length',
    'cookie',
    'host'
  ]) {
    delete headers[name];
  }

  const response = await fetch(request.url(), {
    method: 'POST',
    headers,
    body: request.postDataBuffer(),
    redirect: 'manual'
  });
  return {
    status: response.status,
    location: response.headers.get('location'),
    actionRedirect: response.headers.get('x-action-redirect'),
    body: await response.text()
  };
}

function isLoginRedirect(response) {
  return (
    response.location?.includes('/admin/login') ||
    response.actionRedirect?.includes('/admin/login') ||
    response.body.includes('/admin/login')
  );
}

try {
  initialEnabled = await readFlag();

  await page.goto(`${baseUrl}/admin/settings`, {waitUntil: 'networkidle'});
  if (!page.url().includes('/admin/login')) {
    throw new Error('Unauthenticated settings request was not redirected');
  }

  await page.getByLabel('Password').fill(adminPassword);
  await Promise.all([
    page.waitForURL(`${baseUrl}/admin`),
    page.getByRole('button', {name: 'Sign in'}).click()
  ]);
  await page.goto(`${baseUrl}/admin/settings`, {waitUntil: 'networkidle'});

  if (initialEnabled) await clickFlag(false);
  if (await readFlag()) throw new Error('Admin could not disable the flag');
  await assertLeadFormVisibility(false);

  const enableRequest = await clickFlag(true, true);
  if (!enableRequest || !(await readFlag())) {
    throw new Error('Admin could not enable the flag');
  }
  await assertLeadFormVisibility(true);

  await page.reload({waitUntil: 'networkidle'});
  if (!(await page.getByRole('button', {name: 'ON', exact: true}).isDisabled())) {
    throw new Error('Enabled flag did not persist after page reload');
  }

  await clickFlag(false);
  if (await readFlag()) throw new Error('Admin could not restore the flag to OFF');
  await assertLeadFormVisibility(false);

  const unauthorized = await replayWithoutCookie(enableRequest);
  if (!isLoginRedirect(unauthorized) || (await readFlag())) {
    throw new Error('Unauthenticated Server Action changed the feature flag');
  }

  const leadResponse = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: new URL(baseUrl).origin,
      'sec-fetch-site': 'same-origin'
    },
    body: JSON.stringify({
      vin: 'WVWZZZ1JZ7W000001',
      preferredContact: 'phone',
      contactValue: '+380671234567',
      description: 'Feature flag verification request',
      locale: 'uk',
      path: '/uk'
    })
  });
  const leadResult = await leadResponse.json();
  if (
    leadResponse.status !== 201 ||
    leadResult.emailStatus !== 'disabled' ||
    typeof leadResult.leadId !== 'string'
  ) {
    throw new Error(`OFF lead submission failed: ${JSON.stringify(leadResult)}`);
  }
  testLeadId = leadResult.leadId;

  const leadRows = await sql.query(
    'select email_status, email_attempted_at from leads where id = $1',
    [testLeadId]
  );
  if (
    leadRows[0]?.email_status !== 'disabled' ||
    leadRows[0]?.email_attempted_at !== null
  ) {
    throw new Error('OFF lead was not persisted without an email attempt');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        defaultAndFinalState: false,
        adminTogglePersisted: true,
        unauthorizedMutationRejected: true,
        offFormHidden: true,
        onFormVisible: true,
        directContactsRemainVisible: true,
        offLeadSaved: true,
        offEmailAttempted: false
      },
      null,
      2
    )
  );
} finally {
  if ((await readFlag().catch(() => initialEnabled)) !== initialEnabled) {
    await page.goto(`${baseUrl}/admin/settings`, {waitUntil: 'networkidle'}).catch(() => undefined);
    await clickFlag(initialEnabled).catch(async () => {
      await sql.query(
        'update feature_flags set enabled = $1, updated_at = now() where name = $2',
        [initialEnabled, flagName]
      );
    });
  }
  if (testLeadId) {
    await sql.query('delete from leads where id = $1', [testLeadId]).catch(() => undefined);
  }
  await browser.close();
}
