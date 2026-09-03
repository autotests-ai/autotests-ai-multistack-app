exports.HomePage = class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
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

  async open() {
    // '.' resolves to the baseURL directory — the SPA root on both root and path mounts.
    await this.page.goto('.');
    await this.shouldBeOpen();
  }

  async logout() {
    await this.logoutButton.click();
  }

  getWelcomeText() {
    return this.welcomeMessage;
  }

  async authTokenKey() {
    return this.page.evaluate(() => {
      const m = location.pathname.match(/\/(backend-[^/]+)\//);
      return m ? `authToken:${m[1]}` : 'authToken';
    });
  }

  async openWithLocalStorageAuth(token) {
    await this.page.goto('login');
    const key = await this.authTokenKey();
    await this.page.evaluate(([k, t]) => localStorage.setItem(k, t), [key, token]);
    await this.open();
  }

  async openWithInvalidToken() {
    await this.openWithLocalStorageAuth('invalid-token');
  }

  async reload() {
    await this.page.reload();
    await this.shouldBeOpen();
  }

  async shouldBeOpen() {
    await this.layout.waitFor({ state: 'visible' });
  }

  async shouldShowLayout() {
    await this.layout.waitFor({ state: 'visible' });
    await this.itemsList.waitFor({ state: 'visible' });
  }

  async stubConfirm(accepted) {
    await this.page.evaluate((ok) => {
      window.__deleteConfirm = null;
      window.confirm = (msg) => {
        window.__deleteConfirm = msg ?? null;
        return ok;
      };
    }, accepted);
  }

  async clickDeleteAccountAndConfirm() {
    await this.stubConfirm(true);
    await this.deleteAccountButton.click();
  }

  async clickDeleteAccountAndCancel() {
    await this.stubConfirm(false);
    await this.deleteAccountButton.click();
  }

  /** Best-effort UI cleanup after a throwaway register. Must not mask the test result. */
  async deleteAccountQuietly() {
    try {
      await this.deleteAccountButton.waitFor({ state: 'visible', timeout: 3000 });
      await this.clickDeleteAccountAndConfirm();
    } catch {
      // not logged in / already gone
    }
  }

  async authToken() {
    const key = await this.authTokenKey();
    return this.page.evaluate((k) => localStorage.getItem(k), key);
  }
};
