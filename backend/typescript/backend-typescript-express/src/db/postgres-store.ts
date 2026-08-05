import type { ItemRecord, Store, UserRecord } from '../store';
import { UsernameTakenError } from '../store';

const UNIQUE_VIOLATION = '23505';

export interface Queryable {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === UNIQUE_VIOLATION;
}

/** `BIGSERIAL` arrives from `pg` as a string; the contract requires a JSON number. */
function toItem(row: Record<string, unknown>): ItemRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description),
  };
}

function toUser(row: Record<string, unknown>): UserRecord {
  return {
    id: Number(row.id),
    username: String(row.username),
    passwordHash: String(row.password_hash),
  };
}

export class PostgresStore implements Store {
  constructor(private readonly db: Queryable) {}

  async listItems(): Promise<ItemRecord[]> {
    const result = await this.db.query(
      'SELECT id, name, description FROM items ORDER BY id ASC',
    );
    return result.rows.map(toItem);
  }

  async countItems(): Promise<number> {
    const result = await this.db.query('SELECT COUNT(*) AS count FROM items');
    return Number(result.rows[0]?.count ?? 0);
  }

  async insertItem(name: string, description: string): Promise<ItemRecord> {
    const result = await this.db.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name, description],
    );
    return toItem(result.rows[0] ?? {});
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    const result = await this.db.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username],
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async insertUser(username: string, passwordHash: string): Promise<UserRecord> {
    try {
      const result = await this.db.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, password_hash',
        [username, passwordHash],
      );
      return toUser(result.rows[0] ?? {});
    } catch (error) {
      // A concurrent insert that won the race must surface as 409, not 500.
      if (isUniqueViolation(error)) {
        throw new UsernameTakenError(username);
      }
      throw error;
    }
  }
}
