import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });
const dir = join(import.meta.dirname, 'schemas');

export function assertSchema(body, name) {
  const schema = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  const validate = ajv.compile(schema);
  const ok = validate(body);
  if (!ok) {
    const msg = (validate.errors || [])
      .map((err) => `${err.instancePath || '/'} ${err.message}`)
      .join('; ');
    throw new Error(msg || `schema ${name} failed`);
  }
}
