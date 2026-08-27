import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { loginToken } from '../../src/helpers/api';
import { UserBuilder } from '../../src/helpers/builders';

const seeded = new UserBuilder().withSeededUser().build();

test.describe('Session', { tag: ['@e2e'] }, () => {
  test('Invalid token clears session and hides welcome', async ({ webApp }) => {
    await webApp.home.openWithInvalidToken();
    await expect(webApp.home.layout).toBeVisible({ timeout: 10_000 });
    await expect(webApp.home.welcomePanel).toHaveAttribute('hidden', '');
    await expect.poll(async () => webApp.home.authToken()).toBeNull();
  });

  test('Session survives a page reload (token in localStorage)', async ({ webApp }) => {
    const token = await loginToken(seeded.username, seeded.password);
    await webApp.home.openWithLocalStorageAuth(token);
    await expect(webApp.home.getWelcomeText()).toContainText(seeded.welcomeMessage());
    await webApp.home.reload();
    await expect(webApp.home.getWelcomeText()).toContainText(seeded.welcomeMessage());
  });
});
