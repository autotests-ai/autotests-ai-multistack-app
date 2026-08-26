const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../../src/helpers/builders');

test.describe('Logout', { tag: ['@e2e'] }, () => {
  test('Пользователь может выйти после логина', async ({ webApp }) => {
    const user = new UserBuilder().withSeededUser().build();
    await webApp.login.open();
    await webApp.login.login(user.username, user.password);
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
    await webApp.home.logout();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
