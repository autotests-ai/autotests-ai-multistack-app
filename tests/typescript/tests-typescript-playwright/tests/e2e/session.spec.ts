import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { loginToken } from '../../src/helpers/api';

test.describe('Session', { tag: ['@e2e'] }, () => {
  test('Invalid token clears session and hides welcome', async ({ webApp }) => {
    await webApp.home.openWithInvalidToken();
    await expect(webApp.home.welcomePanel).toHaveAttribute('hidden', '');
    await expect.poll(async () => webApp.home.authToken()).toBeNull();
  });

  test('Session survives a page reload (token in localStorage)', async ({ webApp }) => {
    const token = await loginToken('user1', 'password1');
    await webApp.home.openWithLocalStorageAuth(token);
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
    await webApp.home.reload();
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
  });
});
