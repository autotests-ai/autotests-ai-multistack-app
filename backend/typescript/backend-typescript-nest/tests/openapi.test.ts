import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import request from 'supertest';

import { createTestApp, type TestContext } from './support/app';

const MODULE_ROOT = join(__dirname, '..');
const SSOT = join(MODULE_ROOT, '..', '..', '..', '_contract', 'openapi.yaml');
const COPY = join(MODULE_ROOT, 'resources', 'openapi.yaml');

describe('GET /api/openapi.yaml', () => {
  let context: TestContext;

  afterEach(async () => {
    await context.app.close();
  });

  it('is the module copy of _contract/openapi.yaml', async () => {
    const expected = readFileSync(COPY);
    expect(expected.equals(readFileSync(SSOT))).toBe(true);

    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/openapi.yaml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/yaml/);
    expect(Buffer.from(response.text, 'utf8').equals(expected)).toBe(true);
  });
});

describe('GET /api/docs', () => {
  let context: TestContext;

  afterEach(async () => {
    await context.app.close();
  });

  it('is Swagger UI over the contract file, not DocumentBuilder', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text.toLowerCase()).toContain('swagger-ui');
  });
});
