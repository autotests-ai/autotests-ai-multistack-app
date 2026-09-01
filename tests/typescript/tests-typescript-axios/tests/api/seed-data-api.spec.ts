import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { request } from '../../api-client';
import { loadConfig } from '../../config';

const config = () => loadConfig();

describe('Seed data on deployed stand', { tags: ['api'] }, () => {
  beforeEach(async () => {
    await epic('Deploy readiness');
    await severity('critical');
  });

  test(
    'Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL',
    { tags: ['smoke'] },
    async () => {
      const response = await request(config(), 'GET', '/api/items');
      expect(response.status).toBe(200);
      const body = response.data as { source: string; items: { name: string }[] };
      expect(body.source).toBe('postgresql');
      const names = body.items.map((item) => item.name);
      expect(names).toEqual(expect.arrayContaining(['Alpha', 'Beta', 'Gamma']));
    },
  );
});
