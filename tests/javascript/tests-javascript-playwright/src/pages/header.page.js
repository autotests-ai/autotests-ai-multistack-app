const { expect } = require('@playwright/test');

exports.HeaderPage = class HeaderPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.root = page.getByTestId('header');
    this.burger = page.getByTestId('header-burger');
    this.menu = page.getByTestId('header-menu');
    const tools = page.getByTestId('header-tools');
    this.langToggle = tools.getByTestId('header-lang-toggle');
    this.langLabel = tools.getByTestId('header-lang-label');
    this.themeToggle = tools.getByTestId('header-theme-toggle');
    this.html = page.locator('html');
  }

  activeNav(testid) {
    return this.page.getByTestId(testid);
  }

  currentPageLinks() {
    return this.page.locator("[data-testid='header-nav'] a[aria-current='page']");
  }

  menuNav(testid) {
    return this.page.getByTestId(testid);
  }

  async shouldHaveActiveNav(navTestid) {
    const item = this.activeNav(navTestid);
    await expect(item).toBeVisible();
    await expect(item).toHaveClass(/is-active/);
    await expect(item).toHaveAttribute('aria-current', 'page');
    await expect(this.currentPageLinks()).toHaveCount(1);
  }

  async shouldHaveActiveMenuNav(menuNavTestid) {
    const item = this.menuNav(menuNavTestid);
    await expect(item).toBeVisible();
    await expect(item).toHaveClass(/is-active/);
    await expect(item).toHaveAttribute('aria-current', 'page');
  }

  async clickNav(testid) {
    await this.activeNav(testid).click();
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 812 });
  }

  async resetViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async openMenu() {
    await this.burger.click();
    await this.menu.waitFor({ state: 'visible' });
  }

  async clickMenuNav(testid) {
    await this.menuNav(testid).click();
  }

  async shouldHaveClosedMenu() {
    await this.menu.waitFor({ state: 'hidden' });
    await expect(this.burger).toHaveAttribute('aria-expanded', 'false');
  }

  async clickLangToggle() {
    await this.langToggle.click();
  }

  async clickThemeToggle() {
    await this.themeToggle.click();
  }
};
