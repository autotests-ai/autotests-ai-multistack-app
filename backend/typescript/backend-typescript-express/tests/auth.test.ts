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
