import { expect, test } from '@playwright/test';
import { apiRequest } from '../../src/helpers/api';

test.describe('Seed data on deployed stand', { tag: ['@api'] }, () => {
  test('Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL', async () => {
    const response = await apiRequest('GET', '/api/items');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { source: string; items: { name: string }[] };
    expect(body.source).toBe('postgresql');
    const names = body.items.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(['Alpha', 'Beta', 'Gamma']));
  });
});
