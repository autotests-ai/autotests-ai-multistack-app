import { PostgresStore, type Queryable } from '../src/db/postgres-store';
import { applySchema, readSchemaStatements, resolveSchemaPath } from '../src/db/schema';
import { UsernameTakenError } from '../src/store';

interface RecordedCall {
  text: string;
  values: unknown[] | undefined;
}

class FakeDb implements Queryable {
  readonly calls: RecordedCall[] = [];

  constructor(
    private readonly responses: Record<string, unknown>[][] = [],
    private readonly error?: unknown,
  ) {}

  async query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> {
    this.calls.push({ text, values });
    if (this.error) {
      throw this.error;
    }
    return { rows: this.responses.shift() ?? [] };
  }
}

describe('PostgresStore', () => {
  it('orders items by id and coerces the BIGSERIAL string into a number', async () => {
    const db = new FakeDb([
      [
        { id: '1', name: 'Alpha', description: 'First' },
        { id: '2', name: 'Beta', description: 'Second' },
      ],
    ]);

    const items = await new PostgresStore(db).listItems();

    expect(items).toEqual([
      { id: 1, name: 'Alpha', description: 'First' },
      { id: 2, name: 'Beta', description: 'Second' },
    ]);
    expect(typeof items[0]!.id).toBe('number');
    expect(db.calls[0]!.text).toContain('ORDER BY id ASC');
  });

  it('counts items from the string count column', async () => {
    const db = new FakeDb([[{ count: '3' }]]);
    await expect(new PostgresStore(db).countItems()).resolves.toBe(3);
  });

  it('counts zero when the table is empty', async () => {
    const db = new FakeDb([[]]);
    await expect(new PostgresStore(db).countItems()).resolves.toBe(0);
  });

  it('inserts an item and returns it with a numeric id', async () => {
    const db = new FakeDb([[{ id: '7', name: 'Alpha', description: 'First' }]]);

    await expect(new PostgresStore(db).insertItem('Alpha', 'First')).resolves.toEqual({
      id: 7,
      name: 'Alpha',
      description: 'First',
    });
    expect(db.calls[0]!.values).toEqual(['Alpha', 'First']);
  });

  it('maps a user row onto camelCase', async () => {
    const db = new FakeDb([[{ id: '4', username: 'user1', password_hash: '$2b$hash' }]]);

    await expect(new PostgresStore(db).findUserByUsername('user1')).resolves.toEqual({
      id: 4,
      username: 'user1',
      passwordHash: '$2b$hash',
    });
  });

  it('returns null for an unknown user', async () => {
    const db = new FakeDb([[]]);
    await expect(new PostgresStore(db).findUserByUsername('ghost')).resolves.toBeNull();
  });

  it('translates a 23505 unique violation into UsernameTakenError', async () => {
    const db = new FakeDb([], Object.assign(new Error('duplicate key'), { code: '23505' }));

    await expect(new PostgresStore(db).insertUser('user1', 'hash')).rejects.toBeInstanceOf(
      UsernameTakenError,
    );
  });

  it('rethrows unrelated database failures', async () => {
    const db = new FakeDb([], Object.assign(new Error('connection lost'), { code: '08006' }));

    await expect(new PostgresStore(db).insertUser('user1', 'hash')).rejects.toThrow(
      'connection lost',
    );
  });

  it('deletes a user by username', async () => {
    const db = new FakeDb([[]]);

    await expect(new PostgresStore(db).deleteUser('user1')).resolves.toBeUndefined();
    expect(db.calls[0]!.text).toContain('DELETE FROM users');
    expect(db.calls[0]!.values).toEqual(['user1']);
  });
});

describe('schema', () => {
  it('finds schema.sql from the compiled or source layout', () => {
    expect(resolveSchemaPath()).toMatch(/schema\.sql$/);
  });

  it('throws when schema.sql is nowhere above the start directory', () => {
    expect(() => resolveSchemaPath('/')).toThrow(/schema\.sql not found/);
  });

  it('splits the file into idempotent DDL statements', () => {
    const statements = readSchemaStatements();

    expect(statements).toHaveLength(3);
    expect(statements[0]).toContain('CREATE TABLE IF NOT EXISTS items');
    expect(statements[1]).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(statements[2]).toContain('CREATE INDEX IF NOT EXISTS idx_users_username');
  });

  it('applies every statement to the connection', async () => {
    const db = new FakeDb();
    await applySchema(db);

    expect(db.calls).toHaveLength(3);
  });
});
