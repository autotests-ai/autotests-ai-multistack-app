import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('mock mount', { tag: ['@e2e', '@mock'] }, () => {
  test('Home shows embedded header and reference layout', async ({ webApp }) => {
    await webApp.home.open();
    await expect(webApp.home.header).toBeVisible();
    await expect(webApp.home.layout).toBeVisible();
    await expect(webApp.home.itemsList).toBeVisible();
  });

  test('Login form fields and submit are visible', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });

  test('Embedded header is visible on login page', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.home.header).toBeVisible();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });

  test('Register form fields and submit are visible', async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.register.registerForm).toBeVisible();
    await expect(webApp.register.formTitle).toContainText('Register');
  });
});
