import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { WRONG_CREDENTIALS_MESSAGE, passwordAtMinLength, request, username, usernameAtMinLength } from '../../api-client';
import { loadConfig } from '../../config';
import { assertSchema } from '../../schema';

const config = () => loadConfig();

describe('Auth API', { tags: ['api'] }, () => {
  beforeEach(async () => {
    await epic('Authentication');
    await severity('critical');
  });

  test(
    'POST /api/auth/login returns the auth contract for a seeded user',
    { tags: ['smoke'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', {
        json: { username: 'user1', password: 'password1' },
      });
      expect(response.status).toBe(200);
      const body = response.data as Record<string, unknown>;
      assertSchema(body, 'auth-response.json');
      expect(body.username).toBe('user1');
      expect(body.redirectUrl).toBe('/');
    },
  );

  test('POST /api/auth/login rejects a wrong password with 401', async () => {
    const response = await request(config(), 'POST', '/api/auth/login', {
      json: { username: 'user1', password: 'wrongpassword' },
    });
    expect(response.status).toBe(401);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(body.message).toBe(WRONG_CREDENTIALS_MESSAGE);
  });

  test('POST /api/auth/login answers an unknown user with the same 401 (no enumeration)', async () => {
    const response = await request(config(), 'POST', '/api/auth/login', {
      json: { username: username(), password: 'password123' },
    });
    expect(response.status).toBe(401);
    expect((response.data as { message: string }).message).toBe(WRONG_CREDENTIALS_MESSAGE);
  });

  test('POST /api/auth/login joins both field errors into one 400 message', async () => {
    const response = await request(config(), 'POST', '/api/auth/login', {
      json: { username: '', password: '' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('username');
    expect(String(body.message)).toContain('password');
    expect(String(body.message)).toContain('; ');
  });

  test(
    'POST /api/auth/login rejects a short username with 400',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', {
        json: { username: 'ab', password: 'password1' },
      });
      expect(response.status).toBe(400);
      const body = response.data as Record<string, unknown>;
      assertSchema(body, 'error.json');
      expect(String(body.message)).toContain('username');
    },
  );

  test(
    'POST /api/auth/login rejects a short password with 400',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', {
        json: { username: 'user1', password: '123' },
      });
      expect(response.status).toBe(400);
      const body = response.data as Record<string, unknown>;
      assertSchema(body, 'error.json');
      expect(String(body.message)).toContain('password');
    },
  );

  test(
    'POST /api/auth/login rejects an empty username with 400',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', {
        json: { username: '', password: 'password1' },
      });
      expect(response.status).toBe(400);
      const body = response.data as Record<string, unknown>;
      assertSchema(body, 'error.json');
      expect(String(body.message)).toContain('username');
    },
  );

  test(
    'POST /api/auth/login rejects an empty password with 400',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', {
        json: { username: 'user1', password: '' },
      });
      expect(response.status).toBe(400);
      const body = response.data as Record<string, unknown>;
      assertSchema(body, 'error.json');
      expect(String(body.message)).toContain('password');
    },
  );

  test(
    'POST /api/auth/login answers a malformed JSON body with 400, not 401',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'POST', '/api/auth/login', { raw: 'not json' });
      expect(response.status).toBe(400);
      expect((response.data as { message: string }).message).toBe('Request body is not valid JSON');
    },
  );

  test('POST /api/auth/register creates a user, returns the auth contract, and cleans up', async () => {
    const name = username();
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: name, password: 'password123' },
    });
    expect(response.status).toBe(201);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'auth-response.json');
    expect(body.username).toBe(name);
    expect(body.redirectUrl).toBe('/');
    await request(config(), 'DELETE', '/api/auth/me', { token: String(body.token) });
  });

  test('POST /api/auth/register accepts a 3-character username and 6-character password', async () => {
    const name = usernameAtMinLength();
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: name, password: passwordAtMinLength() },
    });
    expect(response.status).toBe(201);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'auth-response.json');
    expect(body.username).toBe(name);
    await request(config(), 'DELETE', '/api/auth/me', { token: String(body.token) });
  });

  test('POST /api/auth/login with min-length unknown user is 401, not 400', async () => {
    const response = await request(config(), 'POST', '/api/auth/login', {
      json: { username: usernameAtMinLength(), password: passwordAtMinLength() },
    });
    expect(response.status).toBe(401);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(body.message).toBe(WRONG_CREDENTIALS_MESSAGE);
  });

  test('POST /api/auth/register rejects a duplicate username with 409', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: 'user1', password: 'password123' },
    });
    expect(response.status).toBe(409);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(body.message).toBe('Username already taken');
  });

  test('POST /api/auth/register rejects a short password with 400', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: 'shortuser', password: 'abc' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('password');
  });

  test('POST /api/auth/register rejects a short username with 400', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: 'ab', password: 'password123' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('username');
  });

  test('POST /api/auth/register rejects an empty username with 400', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: '', password: 'password123' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('username');
  });

  test('POST /api/auth/register rejects an empty password with 400', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: 'newuser', password: '' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('password');
  });

  test('POST /api/auth/register joins both field errors into one 400 message', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', {
      json: { username: '', password: '' },
    });
    expect(response.status).toBe(400);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'error.json');
    expect(String(body.message)).toContain('username');
    expect(String(body.message)).toContain('password');
  });

  test('POST /api/auth/register answers a malformed JSON body with 400, not 401', async () => {
    const response = await request(config(), 'POST', '/api/auth/register', { raw: 'not json' });
    expect(response.status).toBe(400);
    expect((response.data as { message: string }).message).toBe('Request body is not valid JSON');
  });

  test('GET /api/auth/me returns the profile contract for a bearer token', async () => {
    const login = await request(config(), 'POST', '/api/auth/login', {
      json: { username: 'user1', password: 'password1' },
    });
    const token = String((login.data as { token: string }).token);
    const response = await request(config(), 'GET', '/api/auth/me', { token });
    expect(response.status).toBe(200);
    const body = response.data as Record<string, unknown>;
    assertSchema(body, 'profile.json');
    expect(body.username).toBe('user1');
  });

  test('GET /api/auth/me without a token returns 401', async () => {
    const response = await request(config(), 'GET', '/api/auth/me');
    expect(response.status).toBe(401);
  });

  test('GET /api/auth/me with a garbage token returns 401', async () => {
    const response = await request(config(), 'GET', '/api/auth/me', { token: 'not-a-jwt' });
    expect(response.status).toBe(401);
  });

  test('POST /api/auth/logout returns 204', async () => {
    const response = await request(config(), 'POST', '/api/auth/logout');
    expect(response.status).toBe(204);
  });

  test(
    'DELETE /api/auth/me without a token returns 401',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'DELETE', '/api/auth/me');
      expect(response.status).toBe(401);
    },
  );

  test(
    'DELETE /api/auth/me with a garbage token returns 401',
    { tags: ['negative'] },
    async () => {
      const response = await request(config(), 'DELETE', '/api/auth/me', { token: 'not-a-jwt' });
      expect(response.status).toBe(401);
    },
  );

  test('DELETE /api/auth/me removes the account: repeated login is rejected', async () => {
    const name = username();
    const created = await request(config(), 'POST', '/api/auth/register', {
      json: { username: name, password: 'password123' },
    });
    const token = String((created.data as { token: string }).token);
    await request(config(), 'DELETE', '/api/auth/me', { token });
    const response = await request(config(), 'POST', '/api/auth/login', {
      json: { username: name, password: 'password123' },
    });
    expect(response.status).toBe(401);
    expect((response.data as { message: string }).message).toBe(WRONG_CREDENTIALS_MESSAGE);
  });

  test('unmapped /api/* path requires authentication (security catch-all)', async () => {
    const response = await request(config(), 'GET', '/api/nope');
    expect(response.status).toBe(401);
  });
});
