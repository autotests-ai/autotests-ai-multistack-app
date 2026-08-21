const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../../src/helpers/builders');
const { captureAndCompare } = require('../../src/helpers/screenshot');

const HEIGHT = 900;
const WIDTHS = [390, 768, 1280];

test.describe('screenshots', { tag: ['@e2e', '@screenshot'] }, () => {
  for (const width of WIDTHS) {
    test(`Login form matches screenshot at ${width}px`, async ({ webApp, page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await captureAndCompare(webApp.login.loginForm, 'login', width, `login-${width}`);
    });
  }

  test('Home layout matches screenshot at 1280px', async ({ webApp, page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await webApp.home.open();
    await captureAndCompare(webApp.home.layout, 'home-layout', 1280, 'home-layout-1280');
  });

  for (const width of WIDTHS) {
    test(`Welcome panel matches screenshot at ${width}px`, async ({ webApp, page }) => {
      const user = new UserBuilder().withSeededUser().build();
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await webApp.login.login(user.username, user.password);
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
