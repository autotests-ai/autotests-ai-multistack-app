'use strict';

const { seedData, SEED_ITEMS } = require('../src/seed');
const { DuplicateUsernameError } = require('../src/errors');
const { checkPassword } = require('../src/passwords');
const { createFakeStore } = require('./fake-store');

describe('seedData', () => {
  it('inserts the three demo items and user1 into an empty store', async () => {
    const store = createFakeStore();

    await seedData(store);

    expect(await store.listItems()).toEqual([
      { id: 1, name: 'Alpha', description: 'First seeded item from PostgreSQL' },
      { id: 2, name: 'Beta', description: 'Second seeded item for demo API' },
      {
        id: 3,
        name: 'Gamma',
        description: 'Third item — reference-app bootstrap',
      },
    ]);

    const user = await store.findUserByUsername('user1');
    expect(checkPassword('password1', user.passwordHash)).toBe(true);
  });

  it('is idempotent across restarts', async () => {
    const store = createFakeStore();

    await seedData(store);
    await seedData(store);

    expect(await store.countItems()).toBe(SEED_ITEMS.length);
    expect(store.state.users).toHaveLength(1);
  });

  it('leaves a non-empty items table untouched', async () => {
    const store = createFakeStore({
      items: [{ name: 'Existing', description: 'Kept as is' }],
    });

    await seedData(store);

    expect(await store.listItems()).toEqual([
      { id: 1, name: 'Existing', description: 'Kept as is' },
    ]);
  });

  it('tolerates another replica winning the user1 insert race', async () => {
    const store = createFakeStore();
    store.findUserByUsername = async () => null;
    store.insertUser = async () => {
      throw new DuplicateUsernameError('user1');
    };

    await expect(seedData(store)).resolves.toBeUndefined();
  });

  it('propagates unexpected store failures', async () => {
    const store = createFakeStore();
    store.insertUser = async () => {
      throw new Error('connection refused');
    };

    await expect(seedData(store)).rejects.toThrow('connection refused');
  });
});
