import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Header', { tag: ['@ui'] }, () => {
  test('Login page stays English by default', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.login.formTitle).toContainText('Login Form');
    await expect(webApp.header.langLabel).toContainText('EN');
    await expect(webApp.header.html).toHaveAttribute('lang', 'en');
  });

  test('Theme toggle persists light theme after reload', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.login.formTitle).toContainText('Login Form');
    await expect(webApp.header.html).not.toHaveClass(/theme-light/);
    await webApp.header.clickThemeToggle();
    await expect(webApp.header.html).toHaveClass(/theme-light/);
    await webApp.login.reload();
    await expect(webApp.header.html).toHaveClass(/theme-light/);
  });

  test('Lang toggle switches login copy to Russian and back', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.login.formTitle).toContainText('Login Form');
    await webApp.header.clickLangToggle();
    await expect(webApp.header.langLabel).toContainText('RU');
    await expect(webApp.header.html).toHaveAttribute('lang', 'ru');
    await expect(webApp.login.formTitle).toContainText('Форма входа');
    await webApp.login.reload();
    await expect(webApp.header.langLabel).toContainText('RU');
    await expect(webApp.header.html).toHaveAttribute('lang', 'ru');
    await expect(webApp.login.formTitle).toContainText('Форма входа');
    await webApp.header.clickLangToggle();
    await expect(webApp.header.langLabel).toContainText('EN');
    await expect(webApp.header.html).toHaveAttribute('lang', 'en');
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
