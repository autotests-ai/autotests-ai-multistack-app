import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { UserBuilder } from '../../src/helpers/builders';
import { captureAndCompare } from '../../src/helpers/screenshot';

const HEIGHT = 900;
const WIDTHS = [390, 768, 1280];

test.describe('Welcome panel screenshot', { tag: ['@e2e', '@screenshot'] }, () => {
  for (const width of WIDTHS) {
    test(`Welcome panel matches screenshot at ${width}px`, async ({ webApp, page }) => {
      const user = new UserBuilder().withSeededUser().build();
      await page.setViewportSize({ width, height: HEIGHT });
      await webApp.login.open();
      await webApp.login.login(user.username!, user.password!);
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
