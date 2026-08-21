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
    this.header = page.getByTestId('header');
  }

  async open() {
    // '.' resolves to the baseURL directory — the SPA root on both root and path mounts.
    await this.page.goto('.');
  }

  async logout() {
    await this.logoutButton.click();
  }

  getWelcomeText() {
    return this.welcomeMessage;
  }
};
