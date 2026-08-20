'use strict';

const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createJwt } = require('../src/jwt');
const { seedData } = require('../src/seed');
const { createPgStore } = require('../src/store');
const { SETTINGS } = require('./helpers');

const START_TIMEOUT_MS = 120_000;

describe('application wiring on real PostgreSQL', () => {
  let container;
  let store;
  let app;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    store = createPgStore(container.getConnectionUri());
    await store.applySchema();
    await seedData(store);
    app = createApp({ store, settings: SETTINGS, jwt: createJwt(SETTINGS) });
  }, START_TIMEOUT_MS);

  afterAll(async () => {
    if (store) {
      await store.close();
    }
    if (container) {
      await container.stop();
    }
  });

  it('GET /api/health reports this module id', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: SETTINGS.serviceName,
    });
  });

  it('GET /api/items is served from PostgreSQL seed', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].name).toBe('Alpha');
  });

  it('register → login → me against PostgreSQL', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ username: 'pguser', password: 'password123' });
    expect(register.status).toBe(201);
    const token = register.body.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ username: 'pguser' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pguser', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.username).toBe('pguser');
  });
});
