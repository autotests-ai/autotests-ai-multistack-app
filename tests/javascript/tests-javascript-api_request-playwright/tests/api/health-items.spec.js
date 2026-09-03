const { test, expect } = require('@playwright/test');
const { apiRequest } = require('../../src/helpers/api');
const { assertSchema } = require('../../src/helpers/schema');

test.describe('Health and items API', { tag: ['@api'] }, () => {
  test('GET /api/health matches the health contract and reports ok', async () => {
    const response = await apiRequest('GET', '/api/health');
    expect(response.status).toBe(200);
    const body = await response.json();
    assertSchema(body, 'health.json');
    expect(body.status).toBe('ok');
  });

  test('GET /api/items matches the items contract (typed rows, named source)', async () => {
    const response = await apiRequest('GET', '/api/items');
    expect(response.status).toBe(200);
    assertSchema(await response.json(), 'items.json');
  });
});
