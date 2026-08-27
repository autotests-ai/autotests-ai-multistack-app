const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../../src/helpers/builders');

const LOGIN_REQUIRED = 'Login is required (minimum 3 characters)';
const LOGIN_MIN_LENGTH = 'Login must be at least 3 characters';
const PASSWORD_REQUIRED = 'Password is required (minimum 6 characters)';
const PASSWORD_MIN_LENGTH = 'Password must be at least 6 characters';
const BOTH_REQUIRED = 'Login and password are required (minimum 3 and 6 characters)';
const WRONG_CREDENTIALS = 'Wrong login or password';

const seeded = new UserBuilder().withSeededUser().build();

test.describe('Login', { tag: ['@e2e'] }, () => {
  test('Пользователь может войти с валидными credentials', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.login(seeded.username, seeded.password);
    await expect(webApp.home.getWelcomeText()).toContainText(seeded.welcomeMessage());
  });

  test('Пустой логин показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typePassword(seeded.password);
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(LOGIN_REQUIRED);
  });

  test('Пустой пароль показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername(seeded.username);
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(PASSWORD_REQUIRED);
  });

  test('Неверный пароль показывает читаемую ошибку', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername(seeded.username);
    await webApp.login.typePassword('wrongpassword');
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(WRONG_CREDENTIALS);
  });

  test('Короткий логин показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername('ab');
    await webApp.login.typePassword(seeded.password);
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(LOGIN_MIN_LENGTH);
  });

  test('Короткий пароль показывает ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername(seeded.username);
    await webApp.login.typePassword('123');
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(PASSWORD_MIN_LENGTH);
  });

  test('Неверный логин показывает читаемую ошибку', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.typeUsername('nouser');
    await webApp.login.typePassword(seeded.password);
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(WRONG_CREDENTIALS);
  });

  test('Пустые логин и пароль показывают ошибку валидации', async ({ webApp }) => {
    await webApp.login.open();
    await webApp.login.submitExpectingError();
    await expect(webApp.login.errorMessage).toContainText(BOTH_REQUIRED);
  });
});
