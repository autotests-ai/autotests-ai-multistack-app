import request from 'supertest';

import { SERVICE_NAME } from '../src/config';
import { SEED_ITEMS } from '../src/seed';

import { createTestContext, type TestContext } from './support/app';

describe('GET /api/health', () => {
  it('reports the module id', async () => {
    const { app } = await createTestContext();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: SERVICE_NAME });
  });
});

describe('GET /api/items', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it('returns the seeded items ordered by id with a postgresql source', async () => {
    const response = await request(context.app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toEqual([
      { id: 1, name: SEED_ITEMS[0]![0], description: SEED_ITEMS[0]![1] },
      { id: 2, name: SEED_ITEMS[1]![0], description: SEED_ITEMS[1]![1] },
      { id: 3, name: SEED_ITEMS[2]![0], description: SEED_ITEMS[2]![1] },
    ]);
  });

  it('serialises ids as JSON numbers', async () => {
    const response = await request(context.app).get('/api/items');
    for (const item of response.body.items as { id: unknown }[]) {
      expect(typeof item.id).toBe('number');
    }
  });

  it('returns an empty list when nothing is stored', async () => {
    const { app } = await createTestContext({ seed: false });
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], source: 'postgresql' });
  });
});

describe('CORS', () => {
  it('allows any origin without credentials and exposes Authorization', async () => {
    const { app } = await createTestContext();
    const response = await request(app).get('/api/health').set('Origin', 'https://example.test');

    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toBe(
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    expect(response.headers['access-control-expose-headers']).toBe('Authorization');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('answers preflight with 204', async () => {
    const { app } = await createTestContext();
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://example.test')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-headers']).toBe('authorization,content-type');
  });
});

describe('unknown routes', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it('answer an unmapped /api path with 401, like the reference security chain', async () => {
    const response = await request(context.app).get('/api/nope');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answer a method no mapped /api route allows with 401', async () => {
    const response = await request(context.app).get('/api/auth/login');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answer a path outside /api with 404', async () => {
    const response = await request(context.app).get('/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not found' });
  });
});
