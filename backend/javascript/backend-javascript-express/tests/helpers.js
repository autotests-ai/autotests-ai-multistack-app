'use strict';

const { createApp } = require('../src/app');
const { createJwt } = require('../src/jwt');
const { hashPassword } = require('../src/passwords');
const { createFakeStore } = require('./fake-store');

const SETTINGS = {
  serviceName: 'backend-javascript-express',
  jwtSecret: 'test-secret-value',
  jwtExpirationMs: 86400000,
  postAuthRedirect: '/',
};

const SEEDED_ITEMS = [
  { name: 'Alpha', description: 'First seeded item from PostgreSQL' },
  { name: 'Beta', description: 'Second seeded item for demo API' },
  { name: 'Gamma', description: 'Third item — reference-app bootstrap' },
];

function buildApp({ items = SEEDED_ITEMS, users = ['user1'] } = {}) {
  const store = createFakeStore({
    items,
    users: users.map((username) => ({
      username,
      passwordHash: hashPassword('password1'),
    })),
  });
  const jwt = createJwt(SETTINGS);
  return { app: createApp({ store, settings: SETTINGS, jwt }), store, jwt };
}

module.exports = { buildApp, SETTINGS, SEEDED_ITEMS };
