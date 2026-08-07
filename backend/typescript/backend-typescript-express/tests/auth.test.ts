import request from 'supertest';

import { JwtService } from '../src/security/jwt';
import { SEED_PASSWORD, SEED_USERNAME } from '../src/seed';

import { createTestContext, TEST_SECRET, type TestContext } from './support/app';

describe('POST /api/auth/register', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it('creates a user and returns 201 with a usable token', async () => {
    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe('newuser');
    expect(response.body.redirectUrl).toBe('/');
    expect(typeof response.body.token).toBe('string');
    expect(context.jwtService.extractUsername(response.body.token as string)).toBe('newuser');
  });

  it('stores the password as a hash, never as plaintext', async () => {
    await request(context.app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'password123' });

    const stored = await context.store.findUserByUsername('newuser');
    expect(stored?.passwordHash).not.toBe('password123');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate username with 409', async () => {
    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ username: SEED_USERNAME, password: SEED_PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
  });

  it('maps a lost unique-constraint race to 409', async () => {
    context.store.failNextInsertWithConflict = true;

    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ username: 'racer', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
  });

  it.each([
    [{ password: 'password123' }, 'username is required'],
    [{ username: 'newuser' }, 'password is required'],
    [{ username: 'ab', password: 'password123' }, 'username must be 3-64 characters'],
    [{ username: 'newuser', password: 'short' }, 'password must be 6-128 characters'],
  ])('rejects %p with 400', async (body, message) => {
    const response = await request(context.app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
  });
});

describe('POST /api/auth/login', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it('returns 200 and a token for the seeded user', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: SEED_USERNAME, password: SEED_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe(SEED_USERNAME);
    expect(response.body.redirectUrl).toBe('/');
    expect(context.jwtService.extractUsername(response.body.token as string)).toBe(SEED_USERNAME);
  });

  it('rejects a wrong password with 401', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: SEED_USERNAME, password: 'wrongpass' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
  });

  it('rejects an unknown user with 401', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
  });

  it('rejects invalid credentials with 400 before touching the store', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: SEED_USERNAME, password: 'x' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'password must be 6-128 characters' });
  });

  it('joins both field errors into one 400 message', async () => {
    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: '', password: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'username is required; password is required' });
  });
});

describe.each(['/api/auth/register', '/api/auth/login'])('JSON body of %s', (path) => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  const postRaw = (raw: string) =>
    request(context.app).post(path).set('Content-Type', 'application/json').send(raw);

  it.each([
    ['a body that is not JSON', 'not json'],
    ['an empty body', ''],
    ['a JSON array', '["a","b"]'],
    ['a JSON scalar', '"user1"'],
  ])('rejects %s with 400', async (_case, raw) => {
    const response = await postRaw(raw);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Request body is not valid JSON' });
  });

  it('validates an empty JSON object instead of calling it malformed', async () => {
    const response = await postRaw('{}');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'username is required; password is required' });
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 204 with an empty body', async () => {
    const { app } = await createTestContext();
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });
});

describe('GET /api/auth/me', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it('returns the username for a valid bearer token', async () => {
    const token = context.jwtService.createToken(SEED_USERNAME);
    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ username: SEED_USERNAME });
  });

  it('rejects a missing header with 401', async () => {
    const response = await request(context.app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('rejects a non-bearer scheme with 401', async () => {
    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', 'Basic dXNlcjE6cGFzc3dvcmQx');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('rejects a malformed token with 401', async () => {
    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('rejects an expired token with 401', async () => {
    const expired = new JwtService(TEST_SECRET, -1000).createToken(SEED_USERNAME);

    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('rejects a valid token for a user that no longer exists with 401', async () => {
    const token = context.jwtService.createToken('deleted-user');
    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });
});

describe('DELETE /api/auth/me', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  async function registerUser(username: string): Promise<string> {
    const response = await request(context.app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' });
    return response.body.token as string;
  }

  it('removes the authenticated account and answers 204 with an empty body', async () => {
    const token = await registerUser('deleteme');

    const response = await request(context.app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    await expect(context.store.listUsernames()).resolves.toEqual([SEED_USERNAME]);
  });

  it('leaves a stateless token verifying but unusable: /me answers 401', async () => {
    const token = await registerUser('deleteme');
    await request(context.app).delete('/api/auth/me').set('Authorization', `Bearer ${token}`);

    const response = await request(context.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('rejects a missing header with 401 and keeps every user', async () => {
    const response = await request(context.app).delete('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await expect(context.store.listUsernames()).resolves.toEqual([SEED_USERNAME]);
  });

  it('rejects login after the account is deleted', async () => {
    const token = await registerUser('gonesoon');
    await request(context.app).delete('/api/auth/me').set('Authorization', `Bearer ${token}`);

    const response = await request(context.app)
      .post('/api/auth/login')
      .send({ username: 'gonesoon', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
  });
});
