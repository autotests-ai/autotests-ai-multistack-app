const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../../src/helpers/builders');

test.describe('Delete account', { tag: ['@e2e'] }, () => {
  test('Confirming delete account clears the session and navigates to login', async ({
    webApp,
  }) => {
    const user = new UserBuilder().withUsername().withPassword().build();
    await webApp.register.open();
    await webApp.register.signup(user.username, user.password);
    await expect(webApp.home.getWelcomeText()).toContainText(user.welcomeMessage());
    await expect(webApp.home.deleteAccountButton).toBeVisible();
    await webApp.home.clickDeleteAccountAndConfirm();
    await expect(webApp.login.formTitle).toContainText('Login Form');
    expect(await webApp.home.authToken()).toBeNull();
  });

  test('Cancelling the confirm keeps the session and sends no delete request', async ({
    webApp,
  }) => {
    const user = new UserBuilder().withUsername().withPassword().build();
    try {
      await webApp.register.open();
      await webApp.register.signup(user.username, user.password);
      await expect(webApp.home.getWelcomeText()).toContainText(user.welcomeMessage());
      await webApp.home.clickDeleteAccountAndCancel();
      await expect(webApp.home.getWelcomeText()).toContainText(user.welcomeMessage());
      expect(await webApp.home.authToken()).toBeTruthy();
    } finally {
      await webApp.home.deleteAccountQuietly();
    }
  });
});
