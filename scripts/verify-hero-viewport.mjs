import {chromium, expect} from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const browser = await chromium.launch({channel: 'chrome', headless: true});

try {
  for (const locale of ['uk', 'ru', 'en']) {
    for (const [width, height] of [[320, 568], [375, 700], [390, 844], [430, 932]]) {
      const context = await browser.newContext({
        viewport: {width, height},
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await page.goto(`${baseUrl}/${locale}`, {waitUntil: 'networkidle'});
      await expect(page.locator('.hero-section')).toHaveAttribute(
        'data-short-viewport', String(height <= 740),
      );

      const measure = () => page.evaluate(() => {
        const hero = document.querySelector('.hero-section');
        return {
          height: hero.getBoundingClientRect().height,
          nextSectionTop: document.querySelector('#trust').getBoundingClientRect().top + scrollY,
          vehicles: getComputedStyle(document.querySelector('.hero-vehicles')).display,
          compact: hero.dataset.shortViewport,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const initial = await measure();

      // Expand the visible viewport by 100px as browser controls retract, while
      // preserving the small viewport. This also crosses the 740px breakpoint.
      await session.send('Emulation.setSmallViewportHeightDifferenceOverride', {difference: 100});
      await session.send('Emulation.setDeviceMetricsOverride', {
        width, height: height + 100, deviceScaleFactor: 1, mobile: true,
      });
      await page.evaluate(() => scrollTo({top: 200, behavior: 'instant'}));
      await expect.poll(measure).toEqual(initial);

      // Restore browser controls and return to the top.
      await session.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 1, mobile: true,
      });
      await session.send('Emulation.setSmallViewportHeightDifferenceOverride', {difference: 0});
      await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
      await expect.poll(measure).toEqual(initial);
      expect(initial.overflow).toBe(false);
      console.log(`${locale} ${width}x${height}: hero and following content remain stable`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
