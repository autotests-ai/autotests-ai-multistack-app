const { test } = require('../../src/helpers/fixtures/fixture');
const { captureAndCompare } = require('../../src/helpers/screenshot');

const HEIGHT = 900;
const WIDTHS = [390, 768, 1280];

test.describe('Login screenshot', { tag: ['@ui', '@screenshot'] }, () => {
  for (const width of WIDTHS) {
    test(`Login form matches screenshot at ${width}px`, async ({ webApp, page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await captureAndCompare(webApp.login.loginForm, 'login', width, `login-${width}`);
    });
  }
});
