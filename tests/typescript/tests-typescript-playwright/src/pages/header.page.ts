import { expect, type Locator, type Page } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly root: Locator;
  readonly burger: Locator;
  readonly menu: Locator;
  readonly langToggle: Locator;
  readonly langLabel: Locator;
  readonly themeToggle: Locator;
  readonly html: Locator;

  constructor(page: Page) {
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

  activeNav(testid: string): Locator {
    return this.page.getByTestId(testid);
  }

  currentPageLinks(): Locator {
    return this.page.locator("[data-testid='header-nav'] a[aria-current='page']");
  }

  menuNav(testid: string): Locator {
    return this.page.getByTestId(testid);
  }

  async shouldHaveActiveNav(navTestid: string): Promise<void> {
    const item = this.activeNav(navTestid);
    await expect(item).toBeVisible();
    await expect(item).toHaveClass(/is-active/);
    await expect(item).toHaveAttribute('aria-current', 'page');
    await expect(this.currentPageLinks()).toHaveCount(1);
  }

  async shouldHaveActiveMenuNav(menuNavTestid: string): Promise<void> {
    const item = this.menuNav(menuNavTestid);
    await expect(item).toBeVisible();
    await expect(item).toHaveClass(/is-active/);
    await expect(item).toHaveAttribute('aria-current', 'page');
  }

  async clickNav(testid: string): Promise<void> {
    await this.activeNav(testid).click();
  }

  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 812 });
  }

  async resetViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async openMenu(): Promise<void> {
    await this.burger.click();
    await this.menu.waitFor({ state: 'visible' });
  }

  async clickMenuNav(testid: string): Promise<void> {
    await this.menuNav(testid).click();
  }

  async shouldHaveClosedMenu(): Promise<void> {
    await this.menu.waitFor({ state: 'hidden' });
    await expect(this.burger).toHaveAttribute('aria-expanded', 'false');
  }

  async clickLangToggle(): Promise<void> {
    await this.langToggle.click();
  }

  async clickThemeToggle(): Promise<void> {
    await this.themeToggle.click();
  }
}
