import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RESOURCES = join(__dirname, '..', 'resources');

export function readOpenApiResource(name: string): Buffer {
  return readFileSync(join(RESOURCES, name));
}
