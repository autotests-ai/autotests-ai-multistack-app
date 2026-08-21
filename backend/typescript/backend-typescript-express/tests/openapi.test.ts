import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import request from 'supertest';

import { createTestContext } from './support/app';

const MODULE_ROOT = join(__dirname, '..');
const SSOT = join(MODULE_ROOT, '..', '..', '..', '_contract', 'openapi.yaml');
const COPY = join(MODULE_ROOT, 'resources', 'openapi.yaml');

describe('GET /api/openapi.yaml', () => {
  it('is the module copy of _contract/openapi.yaml', async () => {
    const expected = readFileSync(COPY);
    expect(expected.equals(readFileSync(SSOT))).toBe(true);

    const { app } = await createTestContext();
    const response = await request(app).get('/api/openapi.yaml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/yaml/);
    expect(Buffer.from(response.text, 'utf8').equals(expected)).toBe(true);
  });
});

describe('GET /api/docs', () => {
  it('is Swagger UI pointed at ./openapi.yaml', async () => {
    const { app } = await createTestContext();
    const response = await request(app).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain('./openapi.yaml');
  });
});
