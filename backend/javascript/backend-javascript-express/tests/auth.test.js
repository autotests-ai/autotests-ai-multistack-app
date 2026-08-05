'use strict';

const request = require('supertest');
const jsonwebtoken = require('jsonwebtoken');

const { DuplicateUsernameError } = require('../src/errors');
const { checkPassword } = require('../src/passwords');
const { buildApp, SETTINGS } = require('./helpers');

describe('POST /api/auth/register', () => {
  it('creates the user, hashes the password and returns 201 with a token', async () => {
    const { app, store, jwt } = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newcomer', password: 'password1' });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe('newcomer');
    expect(response.body.redirectUrl).toBe('/');
    expect(jwt.extractUsername(response.body.token)).toBe('newcomer');

    const stored = await store.findUserByUsername('newcomer');
    expect(stored.passwordHash).not.toBe('password1');
    expect(checkPassword('password1', stored.passwordHash)).toBe(true);
  });

  it('answers 409 when the username is already taken', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', password: 'password1' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
  });

  it('answers 409 when the unique constraint fires after the pre-check', async () => {
    const { app, store } = buildApp();
    store.findUserByUsername = async () => null;
    store.insertUser = async () => {
      throw new DuplicateUsernameError('racer');
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'racer', password: 'password1' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
  });

  it.each([
    [{ password: 'password1' }, 'username is required'],
    [{ username: 'newcomer' }, 'password is required'],
    [{ username: 'ab', password: 'password1' }, 'username must be 3-64 characters'],
    [{ username: 'newcomer', password: '12345' }, 'password must be 6-128 characters'],
    [{}, 'username is required'],
  ])('answers 400 for %p', async (body, message) => {
    const { app } = buildApp();
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
  });

  it('answers 400 for a body that is not valid JSON', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{not json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'username is required' });
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with a usable token for the seeded user', async () => {
    const { app, jwt } = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'password1' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('user1');
    expect(response.body.redirectUrl).toBe('/');
    expect(jwt.extractUsername(response.body.token)).toBe('user1');
  });

  it('answers 401 for a wrong password', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
  });

  it('answers 401 for an unknown user', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'password1' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
  });

  it('answers 400 before touching the store when validation fails', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user1', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'password must be 6-128 characters',
    });
  });
});

describe('POST /api/auth/logout', () => {
  it('answers 204 with an empty body, with or without a token', async () => {
    const { app } = buildApp();

    const anonymous = await request(app).post('/api/auth/logout');
    expect(anonymous.status).toBe(204);
    expect(anonymous.text).toBe('');

    const authenticated = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer whatever');
    expect(authenticated.status).toBe(204);
  });
});

describe('GET /api/auth/me', () => {
  async function tokenFor(app, username = 'user1') {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'password1' });
    return response.body.token;
  }

  it('returns the username for a valid bearer token', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${await tokenFor(app)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ username: 'user1' });
  });

  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['a non-bearer scheme', 'Basic dXNlcjE6cGFzc3dvcmQx'],
    ['a bearer scheme without a token', 'Bearer '],
    ['a garbage token', 'Bearer not-a-jwt'],
  ])('answers 401 for %s', async (_label, header) => {
    const { app } = buildApp();
    const call = request(app).get('/api/auth/me');
    if (header !== undefined) {
      call.set('Authorization', header);
    }
    const response = await call;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answers 401 for an expired token', async () => {
    const { app } = buildApp();
    const expired = jsonwebtoken.sign({ sub: 'user1' }, SETTINGS.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: -60,
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answers 401 for a token signed with a different secret', async () => {
    const { app } = buildApp();
    const foreign = jsonwebtoken.sign({ sub: 'user1' }, 'another-secret', {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${foreign}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answers 401 when the token names a user that no longer exists', async () => {
    const { app, store } = buildApp();
    const token = await tokenFor(app);
    store.state.users.length = 0;

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });
});
