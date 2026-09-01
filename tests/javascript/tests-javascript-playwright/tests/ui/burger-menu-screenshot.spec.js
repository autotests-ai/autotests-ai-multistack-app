const { test } = require('../../src/helpers/fixtures/fixture');
const { captureAndCompare } = require('../../src/helpers/screenshot');

const HEIGHT = 900;
const WIDTHS = [390, 768];

test.describe('Burger menu screenshot', { tag: ['@ui', '@screenshot'] }, () => {
  test.afterEach(async ({ webApp }) => {
    await webApp.header.resetViewport();
  });

  for (const width of WIDTHS) {
    test(`Open burger menu matches screenshot at ${width}px`, async ({ webApp, page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await webApp.header.openMenu();
      await captureAndCompare(webApp.header.menu, 'burger-menu', width, `burger-menu-${width}`);
    });
  }
});
