import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { UserBuilder } from '../../src/helpers/builders';

const LOGIN_REQUIRED = 'Login is required (minimum 3 characters)';
const PASSWORD_REQUIRED = 'Password is required (minimum 6 characters)';
const WRONG_CREDENTIALS = 'Wrong login or password';

test.describe('Login', { tag: ['@e2e'] }, () => {
  test('Пользователь может войти с валидными credentials', { tag: ['@crystal'] }, async ({ webApp }) => {
    const user = new UserBuilder().withSeededUser().build();
    await webApp.login.open();
    await webApp.login.login(user.username!, user.password!);
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
  });

  test('Пустой логин показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typePassword('password1');
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(LOGIN_REQUIRED);
  });

  test('Пустой пароль показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername('user1');
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(PASSWORD_REQUIRED);
  });

  test('Неверный пароль показывает читаемую ошибку', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername('user1');
    await webApp.login.typePassword('wrongpassword');
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(WRONG_CREDENTIALS);
  });
});
