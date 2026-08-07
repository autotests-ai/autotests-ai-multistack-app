/** DI token for the persistence seam, so tests can bind an in-memory fake. */
export const STORE = Symbol('STORE');

export interface ItemRecord {
  id: number;
  name: string;
  description: string;
}

export interface UserRecord {
  id: number;
  username: string;
  passwordHash: string;
}

/** Raised when the `users.username` unique constraint rejects an insert. */
export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`username already taken: ${username}`);
    this.name = 'UsernameTakenError';
  }
}

export interface Store {
  listItems(): Promise<ItemRecord[]>;
  countItems(): Promise<number>;
  insertItem(name: string, description: string): Promise<ItemRecord>;
  findUserByUsername(username: string): Promise<UserRecord | null>;
  insertUser(username: string, passwordHash: string): Promise<UserRecord>;
  deleteUser(username: string): Promise<void>;
}
