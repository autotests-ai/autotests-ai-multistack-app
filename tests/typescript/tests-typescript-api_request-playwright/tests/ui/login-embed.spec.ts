import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Login embed', { tag: ['@ui', '@mock'] }, () => {
  test('Embedded header is visible on login page', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.home.header).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
