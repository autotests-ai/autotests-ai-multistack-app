'use strict';

const request = require('supertest');
const jsonwebtoken = require('jsonwebtoken');

const { DuplicateUsernameError } = require('../src/errors');
const { checkPassword } = require('../src/passwords');
const { buildApp, SETTINGS } = require('./helpers');

describe('POST /api/auth/register', () => {
  it('creates the user, hashes the password and returns 201 with a token', async () => {
    const { server, store, jwt, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/register')
      .send({ username: 'newcomer', password: 'password1' });

    expect(response.status).toBe(201);
    expect(response.body.username).toBe('newcomer');
    expect(response.body.redirectUrl).toBe('/');
    expect(jwt.extractUsername(response.body.token)).toBe('newcomer');

    const stored = await store.findUserByUsername('newcomer');
    expect(stored.passwordHash).not.toBe('password1');
    expect(checkPassword('password1', stored.passwordHash)).toBe(true);
    await close();
  });

  it('answers 409 when the username is already taken', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/register')
      .send({ username: 'user1', password: 'password1' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
    await close();
  });

  it('answers 409 when the unique constraint fires after the pre-check', async () => {
    const { server, store, close } = await buildApp();
    store.findUserByUsername = async () => null;
    store.insertUser = async () => {
      throw new DuplicateUsernameError('racer');
    };

    const response = await request(server)
      .post('/api/auth/register')
      .send({ username: 'racer', password: 'password1' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Username already taken' });
    await close();
  });

  it.each([
    [{ password: 'password1' }, 'username is required'],
    [{ username: 'newcomer' }, 'password is required'],
    [{ username: 'ab', password: 'password1' }, 'username must be 3-64 characters'],
    [{ username: 'newcomer', password: '12345' }, 'password must be 6-128 characters'],
    [{}, 'username is required'],
  ])('answers 400 for %p', async (body, message) => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/register')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    await close();
  });

  it('answers 400 for a body that is not valid JSON', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{not json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'username is required' });
    await close();
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with a usable token for the seeded user', async () => {
    const { server, jwt, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'password1' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('user1');
    expect(response.body.redirectUrl).toBe('/');
    expect(jwt.extractUsername(response.body.token)).toBe('user1');
    await close();
  });

  it('answers 401 for a wrong password', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
    await close();
  });

  it('answers 401 for an unknown user', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'password1' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Wrong login or password' });
    await close();
  });

  it('answers 400 before touching the store when validation fails', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .post('/api/auth/login')
      .send({ username: 'user1', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'password must be 6-128 characters',
    });
    await close();
  });
});

describe('POST /api/auth/logout', () => {
  it('answers 204 with an empty body, with or without a token', async () => {
    const { server, close } = await buildApp();

    const anonymous = await request(server).post('/api/auth/logout');
    expect(anonymous.status).toBe(204);
    expect(anonymous.text).toBeFalsy();

    const authenticated = await request(server)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer whatever');
    expect(authenticated.status).toBe(204);
    await close();
  });
});

describe('GET /api/auth/me', () => {
  async function tokenFor(server, username = 'user1') {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ username, password: 'password1' });
    return response.body.token;
  }

  it('returns the username for a valid bearer token', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${await tokenFor(server)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ username: 'user1' });
    await close();
  });

  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['a non-bearer scheme', 'Basic dXNlcjE6cGFzc3dvcmQx'],
    ['a bearer scheme without a token', 'Bearer '],
    ['a garbage token', 'Bearer not-a-jwt'],
  ])('answers 401 for %s', async (_label, header) => {
    const { server, close } = await buildApp();
    const call = request(server).get('/api/auth/me');
    if (header !== undefined) {
      call.set('Authorization', header);
    }
    const response = await call;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });

  it('answers 401 for an expired token', async () => {
    const { server, close } = await buildApp();
    const expired = jsonwebtoken.sign({ sub: 'user1' }, SETTINGS.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: -60,
    });

    const response = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });

  it('answers 401 for a token signed with a different secret', async () => {
    const { server, close } = await buildApp();
    const foreign = jsonwebtoken.sign({ sub: 'user1' }, 'another-secret', {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    const response = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${foreign}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });

  it('answers 401 when the token names a user that no longer exists', async () => {
    const { server, store, close } = await buildApp();
    const token = await tokenFor(server);
    store.state.users.length = 0;

    const response = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });
});
