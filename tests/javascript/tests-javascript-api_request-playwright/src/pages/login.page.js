exports.LoginPage = class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.loginForm = page.getByTestId('login-form');
    this.loginInput = page.getByTestId('login-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.formTitle = page.getByTestId('login-form-title');
    this.errorMessage = page.getByTestId('error-message');
    this.registerLink = page.getByTestId('register-link');
  }

  async open() {
    // Relative to baseURL (ends with '/') — stays inside path-mounted deploys.
    await this.page.goto('login');
    await this.shouldBeOpen();
  }

  async reload() {
    await this.page.reload();
    await this.shouldBeOpen();
  }

  async shouldBeOpen() {
    await this.loginForm.waitFor({ state: 'visible' });
  }

  async shouldShowLoginForm() {
    await this.formTitle.waitFor({ state: 'visible' });
    await this.loginInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async login(username, password) {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async typeUsername(username) {
    await this.loginInput.fill(username);
  }

  async typePassword(password) {
    await this.passwordInput.fill(password);
  }

  async submitExpectingError() {
    await this.submitButton.click();
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }
};
