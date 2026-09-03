const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');

test.describe('Session', { tag: ['@e2e'] }, () => {
  test('Invalid token clears session and hides welcome', async ({ webApp }) => {
    await webApp.home.openWithInvalidToken();
    await expect(webApp.home.welcomePanel).toHaveAttribute('hidden', '');
    await expect.poll(async () => webApp.home.authToken()).toBeNull();
  });

  test('Session survives a page reload (token in localStorage)', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.login('user1', 'password1');
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
    await webApp.home.reload();
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
  });
});
