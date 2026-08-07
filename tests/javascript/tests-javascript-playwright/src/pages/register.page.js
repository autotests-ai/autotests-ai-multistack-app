const { isAppRootUrl } = require('../helpers/env');

exports.RegisterPage = class RegisterPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.registerForm = page.getByTestId('register-form');
    this.loginInput = page.getByTestId('login-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.formTitle = page.getByTestId('register-form-title');
    this.errorMessage = page.getByTestId('error-message');
    this.loginLink = page.getByTestId('login-link');
  }

  async open() {
    // Relative to baseURL (ends with '/') — stays inside path-mounted deploys.
    await this.page.goto('register');
  }

  async signup(username, password, confirmPassword = password) {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
    await this.page.waitForURL(isAppRootUrl);
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }
};
