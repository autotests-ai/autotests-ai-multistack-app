import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Login form', { tag: ['@e2e', '@mock'] }, () => {
  test('Login form fields and submit are visible', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
