import { expect, test } from '@playwright/test';
import { apiRequest } from '../../src/helpers/api';
import { assertSchema } from '../../src/helpers/schema';

test.describe('Health and items API', { tag: ['@api'] }, () => {
  test('GET /api/health matches the health contract and reports ok', async () => {
    const response = await apiRequest('GET', '/api/health');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    assertSchema(body, 'health.json');
    expect(body.status).toBe('ok');
  });

  test('GET /api/items matches the items contract (typed rows, named source)', async () => {
    const response = await apiRequest('GET', '/api/items');
    expect(response.status).toBe(200);
    assertSchema(await response.json(), 'items.json');
  });
});
