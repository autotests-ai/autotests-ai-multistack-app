'use strict';

const request = require('supertest');

const { buildApp, SEEDED_ITEMS } = require('./helpers');

describe('GET /api/health', () => {
  it('reports this module id', async () => {
    const { server, close } = await buildApp();
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'backend-javascript-nest',
    });
    await close();
  });
});

describe('GET /api/items', () => {
  it('returns the seeded rows ordered by id with numeric ids', async () => {
    const { server, close } = await buildApp();
    const response = await request(server).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toEqual([
      { id: 1, ...SEEDED_ITEMS[0] },
      { id: 2, ...SEEDED_ITEMS[1] },
      { id: 3, ...SEEDED_ITEMS[2] },
    ]);
    for (const item of response.body.items) {
      expect(typeof item.id).toBe('number');
    }
    await close();
  });

  it('returns an empty list when the table is empty', async () => {
    const { server, close } = await buildApp({ items: [] });
    const response = await request(server).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], source: 'postgresql' });
    await close();
  });

  it('answers 500 with the error envelope when the store fails', async () => {
    const { server, store, close } = await buildApp();
    store.listItems = async () => {
      throw new Error('connection refused');
    };

    const response = await request(server).get('/api/items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal Server Error' });
    await close();
  });
});

describe('CORS on /api/**', () => {
  it('allows any origin, the contract methods and exposes Authorization', async () => {
    const { server, close } = await buildApp();
    const response = await request(server)
      .options('/api/items')
      .set('Origin', 'https://example.test')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toBe(
      'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    expect(response.headers['access-control-expose-headers']).toBe(
      'Authorization'
    );
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    await close();
  });
});

describe('unknown routes outside /api', () => {
  it('use the same error envelope', async () => {
    const { server, close } = await buildApp();
    const response = await request(server).get('/nope');

    expect(response.status).toBe(404);
    expect(typeof response.body.message).toBe('string');
    expect(Object.keys(response.body)).toEqual(['message']);
    await close();
  });
});

describe('unmapped routes under /api', () => {
  it('answer 401, because the reference authenticates before it routes', async () => {
    const { server, close } = await buildApp();
    const response = await request(server).get('/api/nope');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });

  it('answer 401 for a method no route allows', async () => {
    const { server, close } = await buildApp();
    const response = await request(server).put('/api/health');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    await close();
  });
});
