import type { Page } from '@playwright/test';
import { HeaderPage, HomePage, LoginPage, RegisterPage } from './index';

/** Facade — one entry for all page objects (RealWorldTests style). */
export class App {
  readonly page: Page;
  readonly login: LoginPage;
  readonly register: RegisterPage;
  readonly home: HomePage;
  readonly header: HeaderPage;

  constructor(page: Page) {
    this.page = page;
    this.login = new LoginPage(page);
    this.register = new RegisterPage(page);
    this.home = new HomePage(page);
    this.header = new HeaderPage(page);
  }
}
