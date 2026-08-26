import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { apiRequest, deleteAccountQuietly, username } from '../../src/helpers/api';

const PASSWORD = 'password123';
const DELETE_USER = 'deluser1';

test.describe('Delete account', { tag: ['@e2e'] }, () => {
  test('Пользователь может удалить аккаунт', { tag: ['@crystal'] }, async ({ webApp, request }) => {
    await deleteAccountQuietly(request, DELETE_USER, PASSWORD);
    try {
      await webApp.register.open();
      await webApp.register.signup(DELETE_USER, PASSWORD);
      await expect(webApp.home.getWelcomeText()).toContainText(`Welcome, ${DELETE_USER}!`);
      await webApp.home.clickDeleteAccountAndConfirm();
      await expect(webApp.login.formTitle).toContainText('Login Form');
    } finally {
      await deleteAccountQuietly(request, DELETE_USER, PASSWORD);
    }
  });

  test('Cancelling the confirm keeps the session and sends no delete request', async ({
    webApp,
  }) => {
    const name = username();
    const created = await apiRequest('POST', '/api/auth/register', {
      json: { username: name, password: PASSWORD },
    });
    expect(created.status).toBe(201);
    const token = ((await created.json()) as { token: string }).token;
    try {
      await webApp.home.openWithLocalStorageAuth(token);
      await expect(webApp.home.getWelcomeText()).toContainText(`Welcome, ${name}!`);
      await webApp.home.clickDeleteAccountAndCancel();
      await expect(webApp.home.getWelcomeText()).toContainText(`Welcome, ${name}!`);
      expect(await webApp.home.authToken()).toBeTruthy();
      const still = await apiRequest('POST', '/api/auth/login', {
        json: { username: name, password: PASSWORD },
      });
      expect(still.status).toBe(200);
    } finally {
      await apiRequest('DELETE', '/api/auth/me', { token });
    }
  });
});
