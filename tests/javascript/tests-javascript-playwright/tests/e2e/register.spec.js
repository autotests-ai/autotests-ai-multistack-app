const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../../src/helpers/builders');
const { deleteAccountQuietly } = require('../../src/helpers/api');

const LOGIN_REQUIRED = 'Login is required (minimum 3 characters)';
const LOGIN_MIN_LENGTH = 'Login must be at least 3 characters';
const PASSWORD_REQUIRED = 'Password is required (minimum 6 characters)';
const BOTH_REQUIRED = 'Login and password are required (minimum 3 and 6 characters)';
const REGISTER_PASSWORD = 'password123';

test.describe('Register', { tag: ['@e2e'] }, () => {
  test('Новый пользователь может зарегистрироваться', async ({ webApp, request }) => {
    const user = new UserBuilder().withUsername().withPassword().build();
    try {
      await webApp.register.open();
      await webApp.register.signup(user.username, user.password);
      await expect(webApp.home.getWelcomeText()).toContainText(user.welcomeMessage());
    } finally {
      await deleteAccountQuietly(request, user.username, user.password);
    }
  });

  test('Несовпадение паролей на регистрации показывает ошибку', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typeUsername('newuser');
    await webApp.register.typePassword('password123');
    await webApp.register.typeConfirmPassword('password124');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText('Passwords do not match');
  });

  test('Короткий пароль на регистрации показывает ошибку', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typeUsername('newuser');
    await webApp.register.typePassword('abc');
    await webApp.register.typeConfirmPassword('abc');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText(
      'Password must be at least 6 characters',
    );
  });

  test('Занятый username на регистрации показывает ошибку', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typeUsername('user1');
    await webApp.register.typePassword(REGISTER_PASSWORD);
    await webApp.register.typeConfirmPassword(REGISTER_PASSWORD);
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText('Username already taken');
  });

  test('Короткий логин на регистрации показывает ошибку валидации', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typeUsername('ab');
    await webApp.register.typePassword('password123');
    await webApp.register.typeConfirmPassword('password123');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText(LOGIN_MIN_LENGTH);
  });

  test('Пустой логин на регистрации показывает ошибку валидации', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typePassword('password123');
    await webApp.register.typeConfirmPassword('password123');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText(LOGIN_REQUIRED);
  });

  test('Пустой пароль на регистрации показывает ошибку валидации', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.typeUsername('newuser');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText(PASSWORD_REQUIRED);
  });

  test('Пустые логин и пароль на регистрации показывают ошибку валидации', async ({ webApp }) => {
    await webApp.register.open();
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText(BOTH_REQUIRED);
  });
});
