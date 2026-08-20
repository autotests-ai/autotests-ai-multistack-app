'use strict';

const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const request = require('supertest');

const { seedData } = require('../src/seed');
const { createPgStore } = require('../src/store');
const { SETTINGS } = require('./helpers');

const START_TIMEOUT_MS = 120_000;

describe('application wiring on real PostgreSQL', () => {
  let container;
  let store;
  let server;
  let close;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    store = createPgStore(container.getConnectionUri());
    await store.applySchema();
    await seedData(store);
    const ctx = await buildAppWithStore(store);
    server = ctx.server;
    close = ctx.close;
  }, START_TIMEOUT_MS);

  afterAll(async () => {
    if (close) {
      await close();
    }
    if (store) {
      await store.close();
    }
    if (container) {
      await container.stop();
    }
  });

  it('GET /api/health reports this module id', async () => {
    const response = await request(server).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: SETTINGS.serviceName,
    });
  });

  it('GET /api/items is served from PostgreSQL seed', async () => {
    const response = await request(server).get('/api/items');
    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].name).toBe('Alpha');
  });

  it('register → login → me against PostgreSQL', async () => {
    const register = await request(server)
      .post('/api/auth/register')
      .send({ username: 'pguser', password: 'password123' });
    expect(register.status).toBe(201);
    const token = register.body.token;

    const me = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ username: 'pguser' });

    const login = await request(server)
      .post('/api/auth/login')
      .send({ username: 'pguser', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.username).toBe('pguser');
  });
});

async function buildAppWithStore(store) {
  const { Test } = require('@nestjs/testing');
  const { AppModule } = require('../src/app.module');
  const { configureApp, NEST_OPTIONS } = require('../src/bootstrap');
  const { JwtService } = require('../src/jwt.service');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register({ store, settings: SETTINGS })],
  }).compile();

  const app = moduleRef.createNestApplication({
    ...NEST_OPTIONS,
    logger: false,
  });
  configureApp(app);
  await app.init();

  return {
    server: app.getHttpServer(),
    jwt: moduleRef.get(JwtService),
    close: () => app.close(),
  };
}
