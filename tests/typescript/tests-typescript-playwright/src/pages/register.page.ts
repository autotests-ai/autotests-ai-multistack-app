import type { Locator, Page } from '@playwright/test';
import { isAppRootUrl } from '../helpers/env';

export class RegisterPage {
  readonly page: Page;
  readonly registerForm: Locator;
  readonly loginInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly formTitle: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerForm = page.getByTestId('register-form');
    this.loginInput = page.getByTestId('register-login-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.formTitle = page.getByTestId('register-form-title');
    this.errorMessage = page.getByTestId('register-error-message');
    this.loginLink = page.getByTestId('login-link');
  }

  async open(): Promise<void> {
    // Relative to baseURL (ends with '/') — stays inside path-mounted deploys.
    await this.page.goto('register');
  }

  async signup(
    username: string,
    password: string,
    confirmPassword = password,
  ): Promise<void> {
    await this.loginInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
    await this.page.waitForURL(isAppRootUrl);
  }

  async typeUsername(username: string): Promise<void> {
    await this.loginInput.fill(username);
  }

  async typePassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async typeConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async submitExpectingError(): Promise<void> {
    await this.submitButton.click();
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async clickLoginLink(): Promise<void> {
    await this.loginLink.click();
  }
}
