const { test } = require('../../src/helpers/fixtures/fixture');
const { captureAndCompare } = require('../../src/helpers/screenshot');

const HEIGHT = 900;
const WIDTHS = [390, 768, 1280];

test.describe('Header screenshot', { tag: ['@ui', '@screenshot'] }, () => {
  test.afterEach(async ({ webApp }) => {
    await webApp.header.resetViewport();
  });

  for (const width of WIDTHS) {
    test(`Header bar matches screenshot at ${width}px`, async ({ webApp, page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await webApp.header.root.waitFor();
      await captureAndCompare(webApp.header.root, 'header', width, `header-${width}`);
    });
  }
});
