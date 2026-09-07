import {chromium} from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error('ADMIN_PASSWORD is required for local-flow verification');
}

const browser = await chromium.launch({channel: 'chrome', headless: true});
const page = await browser.newPage();
const trackingResponses = [];
const verificationId = `codex-${Date.now()}`;

page.on('response', (response) => {
  if (response.url().includes('/api/tracking/')) {
    trackingResponses.push({
      endpoint: new URL(response.url()).pathname,
      status: response.status()
    });
  }
});

try {
  const initialSessionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/tracking/session') && response.status() === 200
  );
  await page.goto(
    `${baseUrl}/uk?gclid=${verificationId}&utm_source=codex_verification&utm_medium=cpc&utm_campaign=local_flow`,
    {waitUntil: 'networkidle'}
  );
  const initialSessionResult = await (await initialSessionResponse).json();

  await page.evaluate(() => {
    window.gtag_report_conversion = () => false;
  });
  await page.locator('.cta-pulse-glow').first().click();
  await page.locator('.contact-dialog-content a[href*="t.me/"]').click();

  // Let the real visible-page heartbeat persist elapsed and active duration.
  await page.waitForTimeout(31_000);

  await page.goto(`${baseUrl}/admin`, {waitUntil: 'networkidle'});
  if (!page.url().includes('/admin/login')) {
    throw new Error('Unauthenticated admin request was not redirected');
  }

  await page.getByLabel('Password').fill(adminPassword);
  await Promise.all([
    page.waitForURL(`${baseUrl}/admin`),
    page.getByRole('button', {name: 'Sign in'}).click()
  ]);

  await page.getByRole('heading', {name: 'Traffic overview'}).waitFor();

  const overviewText = await page.locator('main').innerText();
  if (!overviewText.includes('Traffic overview') || !overviewText.includes('Traffic trend')) {
    throw new Error('Admin overview did not render');
  }

  await Promise.all([
    page.waitForURL(`${baseUrl}/admin/sessions`),
    page.getByRole('link', {name: 'Sessions', exact: true}).click()
  ]);
  const gclidCell = page.getByText(new RegExp(verificationId)).first();
  await gclidCell.waitFor({state: 'visible'});
  await Promise.all([
    page.waitForURL(/\/admin\/sessions\/[0-9a-f-]{36}$/i),
    page.locator('tbody a').first().click()
  ]);
  const sessionId = page.url().split('/').at(-1);

  const detailValue = async (label) =>
    page.locator('dt', {hasText: label}).first().locator('..').locator('dd').innerText();

  const evidence = {
    visitor: await detailValue('Visitor'),
    ip: await detailValue('IP'),
    userAgent: await detailValue('User-Agent'),
    gclid: await detailValue('GCLID'),
    utm: await detailValue('UTM'),
    pageViews: await detailValue('Page views'),
    elapsedDuration: await detailValue('Elapsed duration'),
    activeDuration: await detailValue('Active duration'),
    timeline: await page.locator('section').filter({hasText: 'Activity timeline'}).innerText()
  };

  const reusedSessionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/tracking/session') && response.status() === 200
  );
  await page.goto(`${baseUrl}/uk`, {waitUntil: 'networkidle'});
  const reusedSessionResult = await (await reusedSessionResponse).json();
  await page.goto(`${baseUrl}/admin/sessions/${sessionId}`, {waitUntil: 'networkidle'});
  evidence.pageViewsAfterReuse = await detailValue('Page views');
  evidence.gclidAfterReuse = await detailValue('GCLID');

  if (
    evidence.visitor === '—' ||
    evidence.ip === 'Unavailable' ||
    !evidence.userAgent.includes('Chrome') ||
    evidence.gclid !== verificationId ||
    !evidence.utm.includes('codex_verification') ||
    Number.parseInt(evidence.pageViews, 10) < 1 ||
    evidence.elapsedDuration === '0s' ||
    evidence.activeDuration === '0s' ||
    initialSessionResult.created !== true ||
    reusedSessionResult.created !== false ||
    Number.parseInt(evidence.pageViewsAfterReuse, 10) < 2 ||
    evidence.gclidAfterReuse !== verificationId ||
    !evidence.timeline.toLowerCase().includes('page view') ||
    !evidence.timeline.toLowerCase().includes('telegram click')
  ) {
    throw new Error(`Tracking evidence was incomplete: ${JSON.stringify(evidence)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        verificationId,
        sessionId,
        sessionLifecycle: {
          initialCreated: initialSessionResult.created,
          reusedCreated: reusedSessionResult.created
        },
        trackingResponses,
        evidence
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
