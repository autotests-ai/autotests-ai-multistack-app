import { hashPassword } from './security/password';
import type { Store } from './store';

export const SEED_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['Alpha', 'First seeded item from PostgreSQL'],
  ['Beta', 'Second seeded item for demo API'],
  ['Gamma', 'Third item — multistack bootstrap'],
];

export const SEED_USERNAME = 'user1';
export const SEED_PASSWORD = 'password1';

/** Idempotent: items only when the table is empty, `user1` only when absent. */
export async function seedData(store: Store): Promise<void> {
  if ((await store.countItems()) === 0) {
    for (const [name, description] of SEED_ITEMS) {
      await store.insertItem(name, description);
    }
  }

  if ((await store.findUserByUsername(SEED_USERNAME)) === null) {
    await store.insertUser(SEED_USERNAME, await hashPassword(SEED_PASSWORD));
  }
}
