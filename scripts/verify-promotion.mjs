import {chromium, expect} from '@playwright/test';
import {neon} from '@neondatabase/serverless';
import {mkdir} from 'node:fs/promises';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname))
  throw new Error(
    'Run this mutating verification against a local server only.',
  );
const verifyTracking = !process.argv.includes('--ui-only');
if (!process.env.ADMIN_PASSWORD || !process.env.DATABASE_URL)
  throw new Error('ADMIN_PASSWORD and DATABASE_URL are required');
const sql = neon(process.env.DATABASE_URL);
const initial =
  await sql`select data from promotions where id = 'featured-parts'`;
const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext();
const page = await context.newPage();
const events = [];
const errors = [];
const trackingFailures = [];
page.on('response', (response) => {
  if (!response.url().includes('/api/tracking/')) return;
  // A 409 is the existing session-expiry handshake; the client retries once.
  if (!response.ok() && response.status() !== 409)
    trackingFailures.push(response.status());
  if (response.ok() && response.url().endsWith('/api/tracking/event'))
    events.push(response.request().postDataJSON());
});
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('qa/promotion', {recursive: true});
const admin = await context.newPage();
let saved = false;
try {
  await admin.goto(`${baseUrl}/admin/settings`);
  if (admin.url().includes('/login')) {
    await admin
      .getByLabel('Password', {exact: true})
      .fill(process.env.ADMIN_PASSWORD);
    await admin.getByRole('button', {name: 'Sign in', exact: true}).click();
    await admin.waitForURL(`${baseUrl}/admin`);
    await admin.goto(`${baseUrl}/admin/settings`);
  }
  const editor = admin.locator('section').filter({
    has: admin.getByRole('heading', {name: 'Featured parts promotion'}),
  });

  async function saveEditor() {
    const response = admin.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        Boolean(response.request().headers()['next-action']),
    );
    await editor
      .getByRole('button', {name: 'Save promotion', exact: true})
      .click();
    expect((await response).ok()).toBe(true);
    await expect(editor.getByRole('status')).toHaveText('Promotion saved.');
  }
  await editor.getByLabel('Enable promotion banner').check();
  saved = true;
  await saveEditor();
  const persisted =
    await sql`select data from promotions where id = 'featured-parts'`;
  expect(persisted[0].data.enabled).toBe(true);

  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 740],
  ]) {
    await page.setViewportSize({width, height});
    events.length = 0;
    await page.goto(`${baseUrl}/uk`, {waitUntil: 'networkidle'});
    const banner = page.locator('aside[data-promotion-id]');
    await banner.evaluate((el) =>
      el.scrollIntoView({block: 'center', behavior: 'instant'}),
    );
    await expect(banner).toBeVisible();
    expect(
      await banner.evaluate((el) => el.getBoundingClientRect().height),
    ).toBeLessThan(width < 640 ? 195 : 150);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `qa/promotion/banner-${width}.png`,
      fullPage: false,
    });
    if (verifyTracking) {
      await expect
        .poll(
          () => events.filter((e) => e.type === 'promotion_impression').length,
        )
        .toBe(1);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await banner.evaluate((el) =>
      el.scrollIntoView({block: 'center', behavior: 'instant'}),
    );
    const trigger = banner.getByRole('button', {name: 'Детальніше'});
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('75 719');
    await expect(dialog).toContainText('20TT02');
    await expect(dialog).toContainText('89530-70130 / 324811-13890');
    expect(await dialog.locator('li').count()).toBe(7);
    if (verifyTracking) {
      await expect
        .poll(
          () =>
            events.filter((e) => e.type === 'promotion_details_open').length,
        )
        .toBe(1);
    }
    const box = await dialog.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    if (width >= 640)
      expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(2);
    await dialog.getByRole('button', {name: 'Зв’язатися з продавцем'}).click();
    for (const href of ['tel:', 'viber:', 'https://t.me/', 'https://wa.me/']) {
      await expect(dialog.locator(`a[href^="${href}"]`)).toBeVisible();
    }
    await page.evaluate(() => {
      window.gtag_report_conversion = () => false;
    });
    await dialog.locator('a[href^="tel:"]').click();
    if (verifyTracking) {
      await expect
        .poll(() => events.filter((e) => e.type === 'phone_click').length)
        .toBe(1);
    }
    const click = events.find((e) => e.type === 'phone_click');
    if (verifyTracking)
      expect(click.metadata).toMatchObject({
        promotionId: 'featured-parts',
        placement: 'details',
        locale: 'uk',
      });
    for (const [href, type] of [
      ['viber:', 'viber_click'],
      ['https://t.me/', 'telegram_click'],
      ['https://wa.me/', 'whatsapp_click'],
    ]) {
      await dialog.locator(`a[href^="${href}"]`).click();
      if (verifyTracking) {
        await expect
          .poll(() => events.filter((event) => event.type === type).length)
          .toBe(1);
      }
      if (verifyTracking)
        expect(
          events.find((event) => event.type === type).metadata.promotionId,
        ).toBe('featured-parts');
    }
    await page.screenshot({path: `qa/promotion/details-${width}.png`});
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    if (verifyTracking)
      expect(
        events.filter((e) => e.type === 'promotion_impression').length,
      ).toBe(1);
    await trigger.click();
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await dialog.getByRole('button', {name: 'Закрити'}).click();
    await expect(trigger).toBeFocused();
    if (width < 640)
      await expect(page.locator('.mobile-contact-bar')).toBeVisible();
  }
  for (const [locale, title, details] of [
    ['ru', 'Двигатель и КПП Peugeot 107', 'Подробнее'],
    ['en', 'Peugeot 107 engine & gearbox', 'View details'],
  ]) {
    await page.goto(`${baseUrl}/${locale}`, {waitUntil: 'networkidle'});
    await expect(page.locator('aside')).toContainText(title);
    await page.locator('aside').getByRole('button', {name: details}).click();
    await expect(page.getByRole('dialog')).toContainText(title);
    await page.keyboard.press('Escape');
  }

  await editor.getByLabel('Enable promotion banner').uncheck();
  await saveEditor();
  await expect(editor.getByRole('status')).toHaveText('Promotion saved.');
  await page.goto(`${baseUrl}/uk`, {waitUntil: 'networkidle'});
  await expect(page.locator('aside[data-promotion-id]')).toHaveCount(0);
  await expect(page.locator('.cta-pulse-glow').first()).toBeVisible();
  await admin.reload();
  await expect(admin.getByLabel('Enable promotion banner')).not.toBeChecked();
  await editor.getByLabel('Enable promotion banner').check();
  await editor.getByText('English', {exact: true}).click();
  await editor.locator('[name="en.title"]').fill('Peugeot 107 verified edit');
  await saveEditor();
  await expect(editor.getByRole('status')).toHaveText('Promotion saved.');
  await page.goto(`${baseUrl}/en`, {waitUntil: 'networkidle'});
  await expect(page.locator('aside')).toContainText(
    'Peugeot 107 verified edit',
  );
  await editor.locator('[name="image"]').setInputFiles({
    name: 'verification.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1XcAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await saveEditor();
  await admin.reload();
  await expect(editor.getByAltText('Current promotion photo')).toBeVisible();
  await page.goto(`${baseUrl}/en`, {waitUntil: 'networkidle'});
  await expect(page.locator('aside img')).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  );
  await editor.getByLabel('Remove current image').check();
  await saveEditor();
  await admin.reload();
  await expect(editor.getByAltText('Current promotion photo')).toHaveCount(0);
  expect(errors).toEqual([]);
  if (verifyTracking) expect(trackingFailures).toEqual([]);
  console.log(
    `PASS: desktop/mobile layouts, dialog bounds, keyboard focus, UA/RU/EN, admin persistence, edits, disable, image upload/removal. Analytics checks: ${verifyTracking ? 'passed' : 'skipped (UI-only)'}.`,
  );
} finally {
  if (saved) {
    if (initial.length)
      await sql`update promotions set data = ${JSON.stringify(initial[0].data)}::jsonb, updated_at = now() where id = 'featured-parts'`;
    else await sql`delete from promotions where id = 'featured-parts'`;
    // Save the restored values through admin to invalidate prerendered public pages.
    await admin.reload();
    const response = admin.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        Boolean(r.request().headers()['next-action']),
    );
    await admin
      .getByRole('button', {name: 'Save promotion', exact: true})
      .click();
    expect((await response).ok()).toBe(true);
    if (!initial.length)
      await sql`delete from promotions where id = 'featured-parts'`;
  }
  await browser.close();
}
