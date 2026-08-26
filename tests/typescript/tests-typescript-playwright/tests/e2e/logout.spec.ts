import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Logout', { tag: ['@e2e', '@crystal'] }, () => {
  test('Пользователь может выйти после логина', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.login('user1', 'password1');
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
    await webApp.home.logout();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
