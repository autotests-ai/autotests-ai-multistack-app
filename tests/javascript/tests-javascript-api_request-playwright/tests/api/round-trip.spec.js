const { test, expect } = require('@playwright/test');
const { apiRequest, username } = require('../../src/helpers/api');

test.describe('Auth account lifecycle on deployed stand', { tag: ['@api'] }, () => {
  test('register → login → me → logout (stateless JWT) → delete → me is 401', async () => {
    const name = username();
    const password = 'password123';

    const created = await apiRequest('POST', '/api/auth/register', {
      json: { username: name, password },
    });
    expect(created.status).toBe(201);
    expect((await created.json()).username).toBe(name);

    const loggedIn = await apiRequest('POST', '/api/auth/login', {
      json: { username: name, password },
    });
    expect(loggedIn.status).toBe(200);
    const token = (await loggedIn.json()).token;

    const me = await apiRequest('GET', '/api/auth/me', { token });
    expect(me.status).toBe(200);
    expect((await me.json()).username).toBe(name);

    const logout = await apiRequest('POST', '/api/auth/logout', { token });
    expect(logout.status).toBe(204);

    const stillMe = await apiRequest('GET', '/api/auth/me', { token });
    expect(stillMe.status).toBe(200);
    expect((await stillMe.json()).username).toBe(name);

    const deleted = await apiRequest('DELETE', '/api/auth/me', { token });
    expect(deleted.status).toBe(204);

    const gone = await apiRequest('GET', '/api/auth/me', { token });
    expect(gone.status).toBe(401);
  });
});
