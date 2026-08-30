import { test } from '../../src/helpers/fixtures/fixture';
import { captureAndCompare } from '../../src/helpers/screenshot';

const HEIGHT = 900;

test.describe('Home layout screenshot', { tag: ['@ui', '@screenshot'] }, () => {
  test('Home layout matches screenshot at 1280px', async ({ webApp, page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await webApp.home.open();
    await captureAndCompare(webApp.home.layout, 'home-layout', 1280, 'home-layout-1280');
  });
});
