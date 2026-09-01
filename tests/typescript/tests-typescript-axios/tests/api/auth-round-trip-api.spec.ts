import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { request, username } from '../../api-client';
import { loadConfig } from '../../config';

const config = () => loadConfig();

describe('Auth account lifecycle on deployed stand', { tags: ['api'] }, () => {
  beforeEach(async () => {
    await epic('Authentication');
    await severity('critical');
  });

  test('register → login → me → logout (stateless JWT) → delete → me is 401', async () => {
    const name = username();
    const password = 'password123';

    const created = await request(config(), 'POST', '/api/auth/register', {
      json: { username: name, password },
    });
    expect(created.status).toBe(201);
    expect((created.data as { username: string }).username).toBe(name);

    const loggedIn = await request(config(), 'POST', '/api/auth/login', {
      json: { username: name, password },
    });
    expect(loggedIn.status).toBe(200);
    const token = (loggedIn.data as { token: string }).token;

    const me = await request(config(), 'GET', '/api/auth/me', { token });
    expect(me.status).toBe(200);
    expect((me.data as { username: string }).username).toBe(name);

    const logout = await request(config(), 'POST', '/api/auth/logout', { token });
    expect(logout.status).toBe(204);

    const stillMe = await request(config(), 'GET', '/api/auth/me', { token });
    expect(stillMe.status).toBe(200);
    expect((stillMe.data as { username: string }).username).toBe(name);

    const deleted = await request(config(), 'DELETE', '/api/auth/me', { token });
    expect(deleted.status).toBe(204);

    const gone = await request(config(), 'GET', '/api/auth/me', { token });
    expect(gone.status).toBe(401);
  });
});
