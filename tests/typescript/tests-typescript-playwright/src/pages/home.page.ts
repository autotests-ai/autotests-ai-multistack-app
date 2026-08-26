import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly layout: Locator;
  readonly healthStatus: Locator;
  readonly itemsList: Locator;
  readonly welcomeMessage: Locator;
  readonly welcomePanel: Locator;
  readonly logoutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
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
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  getWelcomeText(): Locator {
    return this.welcomeMessage;
  }

  async authTokenKey(): Promise<string> {
    return this.page.evaluate(() => {
      const m = location.pathname.match(/\/(backend-[^/]+)\//);
      return m ? `authToken:${m[1]}` : 'authToken';
    });
  }

  async openWithLocalStorageAuth(token: string): Promise<void> {
    await this.page.goto('login');
    const key = await this.authTokenKey();
    await this.page.evaluate(
      ([k, t]) => localStorage.setItem(k, t),
      [key, token] as [string, string],
    );
    await this.open();
  }

  async openWithInvalidToken(): Promise<void> {
    await this.openWithLocalStorageAuth('invalid-token');
  }

  async reload(): Promise<void> {
    await this.page.reload();
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
    await this.stubConfirm(true);
    await this.deleteAccountButton.click();
  }

  async clickDeleteAccountAndCancel(): Promise<void> {
    await this.stubConfirm(false);
    await this.deleteAccountButton.click();
  }

  async authToken(): Promise<string | null> {
    const key = await this.authTokenKey();
    return this.page.evaluate((k) => localStorage.getItem(k), key);
  }
}
