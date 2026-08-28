const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');

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
    await webApp.register.shouldBeOpen();
    await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
  });

  test('Ссылка Register → Login синхронизирует active nav', async ({ webApp }) => {
    await webApp.register.open();
    await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
    await webApp.register.clickLoginLink();
    await webApp.login.shouldBeOpen();
    await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
  });
});
