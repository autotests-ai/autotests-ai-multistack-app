import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly layout: Locator;
  readonly healthStatus: Locator;
  readonly itemsList: Locator;
  readonly welcomeMessage: Locator;
  readonly welcomePanel: Locator;
  readonly logoutButton: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.layout = page.getByTestId('multistack-layout');
    this.healthStatus = page.getByTestId('health-status');
    this.itemsList = page.getByTestId('items-list');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.welcomePanel = page.getByTestId('welcome-panel');
    this.logoutButton = page.getByTestId('logout-button');
    this.header = page.getByTestId('header');
  }

  async open(): Promise<void> {
    // '.' resolves to the baseURL directory — the SPA root on both root and path mounts.
    await this.page.goto('.');
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  getWelcomeText(): Locator {
    return this.welcomeMessage;
  }
}
