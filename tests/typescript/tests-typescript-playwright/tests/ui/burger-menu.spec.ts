import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Burger menu', { tag: ['@ui'] }, () => {
  test.beforeEach(async ({ webApp }) => {
    await webApp.header.setMobileViewport();
  });

  test.afterEach(async ({ webApp }) => {
    await webApp.header.resetViewport();
  });

  test('Menu nav marks Login active on the login page', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.header.openMenu();
    await webApp.header.shouldHaveActiveMenuNav('header-menu-nav-login');
  });

  test('Menu Register opens the register page and closes the menu', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.header.openMenu();
    await webApp.header.shouldHaveActiveMenuNav('header-menu-nav-login');
    await webApp.header.clickMenuNav('header-menu-nav-register');
    await webApp.register.shouldBeOpen();
    await webApp.header.shouldHaveClosedMenu();
    await expect(webApp.header.burger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Menu Login opens the login page and closes the menu', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.header.openMenu();
    await webApp.header.clickMenuNav('header-menu-nav-login');
    await webApp.login.shouldBeOpen();
    await webApp.header.shouldHaveClosedMenu();
    await expect(webApp.header.burger).toHaveAttribute('aria-expanded', 'false');
  });
});
