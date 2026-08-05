import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { Queryable } from './postgres-store';

/**
 * `schema.sql` sits at the module root, which is two levels up from `dist/store`
 * but only one from `src/store` under ts-jest — so walk up instead of hardcoding.
 */
export function resolveSchemaPath(startDir: string = __dirname): string {
  let dir = startDir;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = join(dir, 'schema.sql');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(`schema.sql not found above ${startDir}`);
}

export function readSchemaStatements(path: string = resolveSchemaPath()): string[] {
  return readFileSync(path, 'utf8')
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

export async function applySchema(db: Queryable): Promise<void> {
  for (const statement of readSchemaStatements()) {
    await db.query(statement);
  }
}
