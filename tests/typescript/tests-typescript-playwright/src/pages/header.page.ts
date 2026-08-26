import type { Locator, Page } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('header');
  }

  activeNav(testid: string): Locator {
    return this.page.getByTestId(testid);
  }

  currentPageLinks(): Locator {
    return this.page.locator("[data-testid='header-nav'] a[aria-current='page']");
  }
}
