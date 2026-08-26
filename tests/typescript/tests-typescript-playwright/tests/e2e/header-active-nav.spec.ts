import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Header active nav', { tag: ['@e2e'] }, () => {
  test('Прямой /login подсвечивает Login в header', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
    await expect(webApp.header.activeNav('header-nav-login')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(webApp.header.currentPageLinks()).toHaveCount(1);
  });

  test('Прямой /register подсвечивает Register в header', async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
    await expect(webApp.header.activeNav('header-nav-register')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Ссылка Login → Register синхронизирует active nav', async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
    await webApp.login.clickRegisterLink();
    await expect(webApp.register.registerForm).toBeVisible();
    await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
  });

  test('Ссылка Register → Login синхронизирует active nav', async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
    await webApp.register.clickLoginLink();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
  });
});
