import { expect, test } from '@playwright/test';
import { apiRequest, username } from '../../src/helpers/api';

test.describe('Auth account lifecycle on deployed stand', { tag: ['@api'] }, () => {
  test('register → login → me → logout (stateless JWT) → delete → me is 401', async ({ request }) => {
    const name = username();
    const password = 'password123';

    const created = await apiRequest(request, 'POST', '/api/auth/register', {
      json: { username: name, password },
    });
    expect(created.status()).toBe(201);
    expect(((await created.json()) as { username: string }).username).toBe(name);

    const loggedIn = await apiRequest(request, 'POST', '/api/auth/login', {
      json: { username: name, password },
    });
    expect(loggedIn.status()).toBe(200);
    const token = ((await loggedIn.json()) as { token: string }).token;

    const me = await apiRequest(request, 'GET', '/api/auth/me', { token });
    expect(me.status()).toBe(200);
    expect(((await me.json()) as { username: string }).username).toBe(name);

    const logout = await apiRequest(request, 'POST', '/api/auth/logout', { token });
    expect(logout.status()).toBe(204);

    const stillMe = await apiRequest(request, 'GET', '/api/auth/me', { token });
    expect(stillMe.status()).toBe(200);
    expect(((await stillMe.json()) as { username: string }).username).toBe(name);

    const deleted = await apiRequest(request, 'DELETE', '/api/auth/me', { token });
    expect(deleted.status()).toBe(204);

    const gone = await apiRequest(request, 'GET', '/api/auth/me', { token });
    expect(gone.status()).toBe(401);
  });
});
