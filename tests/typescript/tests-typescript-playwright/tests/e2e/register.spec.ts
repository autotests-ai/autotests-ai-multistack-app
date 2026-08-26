import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { UserBuilder } from '../../src/helpers/builders';
import { deleteAccountQuietly } from '../../src/helpers/api';

test.describe('Register', { tag: ['@e2e'] }, () => {
  test('Новый пользователь может зарегистрироваться', async ({ webApp, request }) => {
    const user = new UserBuilder().withUsername().withPassword().build();
    try {
      await webApp.register.open();
      await webApp.register.signup(user.username!, user.password!);
      await expect(webApp.home.getWelcomeText()).toContainText(
        `Welcome, ${user.username}!`,
      );
    } finally {
      await deleteAccountQuietly(request, user.username!, user.password!);
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
    await webApp.register.typePassword('password123');
    await webApp.register.typeConfirmPassword('password123');
    await webApp.register.submitExpectingError();
    await expect(webApp.register.errorMessage).toContainText('Username already taken');
  });
});
