const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { captureAndCompare } = require('../../src/helpers/screenshot');

const HEIGHT = 900;
const WIDTHS = [390, 768, 1280];

test.describe('Welcome panel screenshot', { tag: ['@e2e', '@screenshot'] }, () => {
  for (const width of WIDTHS) {
    test(`Welcome panel matches screenshot at ${width}px`, async ({ webApp, page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await webApp.login.login('user1', 'password1');
      await expect(webApp.home.welcomeMessage).toContainText('Welcome,');
      await captureAndCompare(
        webApp.home.welcomePanel,
        'welcome-panel',
        width,
        `welcome-panel-${width}`,
      );
    });
  }
});
