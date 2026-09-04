import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Register form', { tag: ['@ui', '@mock'] }, () => {
  test('Register form fields and submit are visible', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.shouldShowRegisterForm();
    await expect(webApp.register.formTitle).toContainText('Register');
  });
});
