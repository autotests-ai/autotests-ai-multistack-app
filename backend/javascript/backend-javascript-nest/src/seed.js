'use strict';

const { hashPassword } = require('./passwords');
const { DuplicateUsernameError } = require('./errors');

const SEED_ITEMS = [
  { name: 'Alpha', description: 'First seeded item from PostgreSQL' },
  { name: 'Beta', description: 'Second seeded item for demo API' },
  { name: 'Gamma', description: 'Third item — multistack bootstrap' },
];

const SEED_USERNAME = 'user1';
const SEED_PASSWORD = 'password1';

async function seedData(store) {
  if ((await store.countItems()) === 0) {
    await store.insertItems(SEED_ITEMS);
  }

  if ((await store.findUserByUsername(SEED_USERNAME)) === null) {
    try {
      await store.insertUser(SEED_USERNAME, hashPassword(SEED_PASSWORD));
    } catch (error) {
      // Another replica seeded the same user first — nothing left to do.
      if (!(error instanceof DuplicateUsernameError)) {
        throw error;
      }
    }
  }
}

module.exports = { seedData, SEED_ITEMS, SEED_USERNAME, SEED_PASSWORD };
