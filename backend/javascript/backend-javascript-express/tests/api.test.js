'use strict';

const request = require('supertest');

const { buildApp, SEEDED_ITEMS } = require('./helpers');

describe('GET /api/health', () => {
  it('reports this module id', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'backend-javascript-express',
    });
  });
});

describe('GET /api/items', () => {
  it('returns the seeded rows ordered by id with numeric ids', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/items');

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
  });

  it('returns an empty list when the table is empty', async () => {
    const { app } = buildApp({ items: [] });
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], source: 'postgresql' });
  });

  it('answers 500 with the error envelope when the store fails', async () => {
    const { app, store } = buildApp();
    store.listItems = async () => {
      throw new Error('connection refused');
    };
    const silenced = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get('/api/items');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal Server Error' });
    silenced.mockRestore();
  });
});

describe('CORS on /api/**', () => {
  it('allows any origin, the contract methods and exposes Authorization', async () => {
    const { app } = buildApp();
    const response = await request(app)
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
  });
});

describe('unknown routes', () => {
  it('use the same error envelope', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not Found' });
  });
});
