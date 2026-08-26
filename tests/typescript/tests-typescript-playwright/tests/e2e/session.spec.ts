import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';
import { loginToken, username, apiRequest } from '../../src/helpers/api';

const PASSWORD = 'password123';

test.describe('session', { tag: ['@e2e'] }, () => {
  test('Invalid token clears session and hides welcome', async ({ webApp }) => {
    await webApp.home.openWithInvalidToken();
    await expect(webApp.home.layout).toBeVisible({ timeout: 10_000 });
    await expect(webApp.home.welcomePanel).toHaveAttribute('hidden', '');
    await expect.poll(async () => webApp.home.authToken()).toBeNull();
  });

  test('Session survives a page reload (token in localStorage)', async ({ webApp }) => {
    const token = await loginToken('user1', 'password1');
    await webApp.home.openWithLocalStorageAuth(token);
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
    await webApp.home.reload();
    await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
  });
});

test.describe('delete account', { tag: ['@e2e'] }, () => {
  test('Confirming delete account clears the session and navigates to login', async ({
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
      await expect(webApp.home.deleteAccountButton).toBeVisible();
      await webApp.home.clickDeleteAccountAndConfirm();
      await expect(webApp.login.formTitle).toContainText('Login Form');
      expect(await webApp.home.authToken()).toBeNull();
    } catch (err) {
      await apiRequest('DELETE', '/api/auth/me', { token });
      throw err;
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
