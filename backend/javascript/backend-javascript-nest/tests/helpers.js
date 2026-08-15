'use strict';

const { Test } = require('@nestjs/testing');

const { AppModule } = require('../src/app.module');
const { configureApp, NEST_OPTIONS } = require('../src/bootstrap');
const { JwtService } = require('../src/jwt.service');
const { hashPassword } = require('../src/passwords');
const { createFakeStore } = require('./fake-store');

const SETTINGS = {
  serviceName: 'backend-javascript-nest',
  jwtSecret: 'test-secret-value',
  jwtExpirationMs: 86400000,
  postAuthRedirect: '/',
};

const SEEDED_ITEMS = [
  { name: 'Alpha', description: 'First seeded item from PostgreSQL' },
  { name: 'Beta', description: 'Second seeded item for demo API' },
  { name: 'Gamma', description: 'Third item — multistack bootstrap' },
];

async function buildApp({ items = SEEDED_ITEMS, users = ['user1'] } = {}) {
  const store = createFakeStore({
    items,
    users: users.map((username) => ({
      username,
      passwordHash: hashPassword('password1'),
    })),
  });

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
    app,
    server: app.getHttpServer(),
    store,
    jwt: moduleRef.get(JwtService),
    close: () => app.close(),
  };
}

module.exports = { buildApp, SETTINGS, SEEDED_ITEMS };
