import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { request } from '../../api-client.js';
import { loadConfig } from '../../config.js';

const config = () => loadConfig();

describe('Backend wiring on deployed stand', { tags: ['api'] }, () => {
  beforeEach(async () => {
    await epic('Wired backend');
    await severity('blocker');
  });

  test(
    'GET /api/health — deployed service is the active backend module, not a neighbour',
    { tags: ['smoke'] },
    async () => {
      const cfg = config();
      const response = await request(cfg, 'GET', '/api/health');
      expect(response.status).toBe(200);
      expect(response.data.service).toBe(cfg.apiHealthService);
    },
  );

  test('GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback', async () => {
    const response = await request(config(), 'GET', '/api/items');
    expect(response.status).toBe(200);
    expect(response.data.source).toBe('postgresql');
  });
});
