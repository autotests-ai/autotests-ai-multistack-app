import type { ItemRecord, Store, UserRecord } from '../../src/store';
import { UsernameTakenError } from '../../src/store';

/** In-memory `Store` so route tests need no PostgreSQL. */
export class FakeStore implements Store {
  private readonly items: ItemRecord[] = [];
  private users: UserRecord[] = [];
  private nextItemId = 1;
  private nextUserId = 1;

  /** Set to simulate losing the unique-constraint race inside `insertUser`. */
  failNextInsertWithConflict = false;

  async listItems(): Promise<ItemRecord[]> {
    return [...this.items].sort((left, right) => left.id - right.id);
  }

  async countItems(): Promise<number> {
    return this.items.length;
  }

  async insertItem(name: string, description: string): Promise<ItemRecord> {
    const item: ItemRecord = { id: this.nextItemId++, name, description };
    this.items.push(item);
    return item;
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async insertUser(username: string, passwordHash: string): Promise<UserRecord> {
    if (this.failNextInsertWithConflict) {
      this.failNextInsertWithConflict = false;
      throw new UsernameTakenError(username);
    }
    if (this.users.some((user) => user.username === username)) {
      throw new UsernameTakenError(username);
    }
    const user: UserRecord = { id: this.nextUserId++, username, passwordHash };
    this.users.push(user);
    return user;
  }

  async deleteUser(username: string): Promise<void> {
    this.users = this.users.filter((user) => user.username !== username);
  }

  /** Lets tests assert what survived a delete. */
  async listUsernames(): Promise<string[]> {
    return this.users.map((user) => user.username);
  }
}
