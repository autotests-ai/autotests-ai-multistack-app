import type { Page } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  protected constructor(page: Page) {
    this.page = page;
  }

  protected async openPageWithLocalStorageToken(pagePath: string, token: string): Promise<void> {
    await this.page.goto('icons/qa-guru-logo.svg');
    const key = await this.authTokenKey();
    await this.page.evaluate(
      ([k, t]) => localStorage.setItem(k, t),
      [key, token] as [string, string],
    );
    await this.page.goto(pagePath);
  }

  async authTokenKey(): Promise<string> {
    return this.page.evaluate(() => {
      const m = location.pathname.match(/\/(backend-[^/]+)\//);
      return m ? `authToken:${m[1]}` : 'authToken';
    });
  }

  async authToken(): Promise<string | null> {
    const key = await this.authTokenKey();
    return this.page.evaluate((k) => localStorage.getItem(k), key);
  }
}
