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

  test('Ссылка Register на логине открывает форму регистрации', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.clickRegisterLink();
    await expect(webApp.register.registerForm).toBeVisible();
    await expect(webApp.register.formTitle).toContainText('Register');
  });

  test('Ссылка Login на регистрации открывает форму логина', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.clickLoginLink();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });

  test('Header на логине показывает Login', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.login.open();
    await expect(webApp.header.activeNav('header-nav-login')).toContainText('Login');
  });

  test('Header на регистрации показывает Register', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.header.activeNav('header-nav-register')).toContainText('Register');
  });

  test('Ссылка Register в header открывает форму регистрации', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.login.open();
    await webApp.header.activeNav('header-nav-register').click();
    await expect(webApp.register.registerForm).toBeVisible();
    await expect(webApp.register.formTitle).toContainText('Register');
  });

  test('Ссылка Login в header открывает форму логина', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.register.open();
    await webApp.header.activeNav('header-nav-login').click();
    await expect(webApp.login.loginForm).toBeVisible();
    await expect(webApp.login.formTitle).toContainText('Login Form');
  });
});
