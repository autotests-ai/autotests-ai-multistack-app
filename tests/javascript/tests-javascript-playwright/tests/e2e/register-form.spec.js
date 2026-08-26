const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');

test.describe('Register form', { tag: ['@e2e', '@mock'] }, () => {
  test('Register form fields and submit are visible', async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.register.registerForm).toBeVisible();
    await expect(webApp.register.formTitle).toContainText('Register');
  });
});
