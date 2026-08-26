import { expect, test } from '@playwright/test';
import { apiRequest } from '../../src/helpers/api';

const SERVICE = process.env.API_HEALTH_SERVICE || 'backend-java-spring';

test.describe('Backend wiring on deployed stand', { tag: ['@api'] }, () => {
  test('GET /api/health — deployed service is the active backend module, not a neighbour', async () => {
    const response = await apiRequest('GET', '/api/health');
    expect(response.status).toBe(200);
    expect(((await response.json()) as { service: string }).service).toBe(SERVICE);
  });

  test('GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback', async () => {
    const response = await apiRequest('GET', '/api/items');
    expect(response.status).toBe(200);
    expect(((await response.json()) as { source: string }).source).toBe('postgresql');
  });
});
