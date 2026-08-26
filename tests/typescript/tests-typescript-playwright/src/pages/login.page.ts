import type { Locator, Page } from '@playwright/test';
import { isAppRootUrl } from '../helpers/env';

export class LoginPage {
  readonly page: Page;
  readonly loginForm: Locator;
  readonly loginInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formTitle: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.getByTestId('login-form');
    this.loginInput = page.getByTestId('login-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.formTitle = page.getByTestId('login-form-title');
    this.errorMessage = page.getByTestId('error-message');
    this.registerLink = page.getByTestId('register-link');
  }

  async open(): Promise<void> {
    // Relative to baseURL (ends with '/') — stays inside path-mounted deploys.
    await this.page.goto('login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL(isAppRootUrl);
  }

  async typeUsername(username: string): Promise<void> {
    await this.loginInput.fill(username);
  }

  async typePassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submitExpectingError(): Promise<void> {
    await this.submitButton.click();
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }
}
