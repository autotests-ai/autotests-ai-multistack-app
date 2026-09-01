import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { request } from '../../api-client';
import { loadConfig } from '../../config';
import { assertSchema } from '../../schema';

const config = () => loadConfig();

describe('Health and items API', { tags: ['api'] }, () => {
  beforeEach(async () => {
    await epic('Home');
    await severity('normal');
  });

  test('GET /api/health matches the health contract and reports ok', async () => {
    const response = await request(config(), 'GET', '/api/health');
    expect(response.status).toBe(200);
    const body = response.data as { status: string };
    assertSchema(body, 'health.json');
    expect(body.status).toBe('ok');
  });

  test('GET /api/items matches the items contract (typed rows, named source)', async () => {
    const response = await request(config(), 'GET', '/api/items');
    expect(response.status).toBe(200);
    assertSchema(response.data, 'items.json');
  });
});
