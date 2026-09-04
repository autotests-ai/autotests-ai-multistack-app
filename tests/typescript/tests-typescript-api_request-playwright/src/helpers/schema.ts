// @ts-nocheck
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });
const dir = path.resolve(__dirname, '../../schemas');

function assertSchema(body, name) {
  const schema = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const validate = ajv.compile(schema);
  const ok = validate(body);
  if (!ok) {
    const msg = (validate.errors || [])
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new Error(msg || `schema ${name} failed`);
  }
}

export { assertSchema };
