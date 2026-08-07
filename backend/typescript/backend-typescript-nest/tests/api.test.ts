import request from 'supertest';

import { SERVICE_NAME } from '../src/config';
import { SEED_ITEMS } from '../src/store/seed';

import { createTestApp, type TestContext } from './support/app';

describe('api routes', () => {
  let context: TestContext;

  afterEach(async () => {
    await context.app.close();
  });

  it('GET /api/health reports the module id', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: SERVICE_NAME });
  });

  it('GET /api/items returns the seeded rows ordered by id', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toEqual([
      { id: 1, name: SEED_ITEMS[0]![0], description: SEED_ITEMS[0]![1] },
      { id: 2, name: SEED_ITEMS[1]![0], description: SEED_ITEMS[1]![1] },
      { id: 3, name: SEED_ITEMS[2]![0], description: SEED_ITEMS[2]![1] },
    ]);
  });

  it('GET /api/items serialises ids as JSON numbers', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/items');

    for (const item of response.body.items as { id: unknown }[]) {
      expect(typeof item.id).toBe('number');
    }
  });

  it('GET /api/items returns an empty list when nothing is stored', async () => {
    context = await createTestApp({ seed: false });
    const response = await request(context.app.getHttpServer()).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], source: 'postgresql' });
  });

  it('answers CORS with any origin, no credentials and Authorization exposed', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'https://example.test');

    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-expose-headers']).toBe('Authorization');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('answers preflight with the allowed methods', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'https://example.test')
      .set('Access-Control-Request-Method', 'POST');

    expect([200, 204]).toContain(response.status);
    expect(response.headers['access-control-allow-methods']).toBe(
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
  });

  it('answers an unmapped /api path with 401, like the reference security chain', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/nope');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('answers a method no mapped /api route allows with 401', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/api/auth/login');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
  });

  it('keeps the {message} 404 shape outside /api', async () => {
    context = await createTestApp();
    const response = await request(context.app.getHttpServer()).get('/nope');

    expect(response.status).toBe(404);
    expect(Object.keys(response.body)).toEqual(['message']);
  });
});
