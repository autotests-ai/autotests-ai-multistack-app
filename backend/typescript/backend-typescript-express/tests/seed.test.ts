import { checkPassword } from '../src/security/password';
import { SEED_ITEMS, SEED_PASSWORD, SEED_USERNAME, seedData } from '../src/seed';

import { FakeStore } from './support/fake-store';

describe('seedData', () => {
  it('inserts the three reference items in order', async () => {
    const store = new FakeStore();
    await seedData(store);

    expect(await store.listItems()).toEqual([
      { id: 1, name: 'Alpha', description: 'First seeded item from PostgreSQL' },
      { id: 2, name: 'Beta', description: 'Second seeded item for demo API' },
      { id: 3, name: 'Gamma', description: 'Third item — multistack bootstrap' },
    ]);
    expect(SEED_ITEMS).toHaveLength(3);
  });

  it('creates user1 with a bcrypt-checkable password', async () => {
    const store = new FakeStore();
    await seedData(store);

    const user = await store.findUserByUsername(SEED_USERNAME);
    expect(user).not.toBeNull();
    await expect(checkPassword(SEED_PASSWORD, user!.passwordHash)).resolves.toBe(true);
  });

  it('is idempotent across repeated startups', async () => {
    const store = new FakeStore();
    await seedData(store);
    await seedData(store);
    await seedData(store);

    expect(await store.countItems()).toBe(3);
  });

  it('leaves a non-empty items table untouched', async () => {
    const store = new FakeStore();
    await store.insertItem('Existing', 'Pre-existing row');
    await seedData(store);

    expect(await store.listItems()).toEqual([
      { id: 1, name: 'Existing', description: 'Pre-existing row' },
    ]);
  });
});
