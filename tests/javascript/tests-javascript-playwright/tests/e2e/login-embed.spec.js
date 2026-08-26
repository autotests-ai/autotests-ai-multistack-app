const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');

test.describe('Login embed', { tag: ['@e2e', '@mock'] }, () => {
  test('Embedded header is visible on login page', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.home.header).toBeVisible();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
