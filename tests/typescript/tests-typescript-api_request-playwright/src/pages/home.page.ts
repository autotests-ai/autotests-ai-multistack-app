import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly layout: Locator;
  readonly healthStatus: Locator;
  readonly itemsList: Locator;
  readonly welcomeMessage: Locator;
  readonly welcomePanel: Locator;
  readonly logoutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    super(page);
    this.layout = page.getByTestId('multistack-layout');
    this.healthStatus = page.getByTestId('health-status');
    this.itemsList = page.getByTestId('items-list');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.welcomePanel = page.getByTestId('welcome-panel');
    this.logoutButton = page.getByTestId('logout-button');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
    this.header = page.getByTestId('header');
  }

  async open(): Promise<void> {
    // '.' resolves to the baseURL directory — the SPA root on both root and path mounts.
    await this.page.goto('.');
    await this.shouldBeOpen();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  getWelcomeText(): Locator {
    return this.welcomeMessage;
  }

  async openWithLocalStorageAuth(token: string): Promise<void> {
    await this.openPageWithLocalStorageToken('.', token);
    await this.shouldBeOpen();
  }

  async openWithInvalidToken(): Promise<void> {
    await this.openWithLocalStorageAuth('invalid-token');
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.shouldBeOpen();
  }

  async shouldBeOpen(): Promise<void> {
    await this.layout.waitFor({ state: 'visible' });
  }

  async shouldShowLayout(): Promise<void> {
    await this.layout.waitFor({ state: 'visible' });
    await this.itemsList.waitFor({ state: 'visible' });
  }

  async stubConfirm(accepted: boolean): Promise<void> {
    await this.page.evaluate((ok) => {
      (window as Window & { __deleteConfirm?: string | null }).__deleteConfirm = null;
      window.confirm = (msg?: string) => {
        (window as Window & { __deleteConfirm?: string | null }).__deleteConfirm = msg ?? null;
        return ok;
      };
    }, accepted);
  }

  async clickDeleteAccountAndConfirm(): Promise<void> {
    this.page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await this.deleteAccountButton.click();
  }

  async clickDeleteAccountAndCancel(): Promise<void> {
    await this.stubConfirm(false);
    await this.deleteAccountButton.click();
  }
}
