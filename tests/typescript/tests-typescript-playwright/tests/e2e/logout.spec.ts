import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { UserBuilder } from '../../src/helpers/builders';

const seeded = new UserBuilder().withSeededUser().build();

test.describe('Logout', { tag: ['@e2e', '@crystal'] }, () => {
  test('Пользователь может выйти после логина', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.login(seeded.username, seeded.password);
    await expect(webApp.home.getWelcomeText()).toContainText(seeded.welcomeMessage());
    await webApp.home.logout();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
