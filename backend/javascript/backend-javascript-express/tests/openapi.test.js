'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { buildApp } = require('./helpers');

const MODULE_ROOT = path.join(__dirname, '..');
const SSOT = path.join(MODULE_ROOT, '..', '..', '..', '_contract', 'openapi.yaml');
const COPY = path.join(MODULE_ROOT, 'resources', 'openapi.yaml');

describe('GET /api/openapi.yaml', () => {
  it('is the module copy of _contract/openapi.yaml', async () => {
    const expected = fs.readFileSync(COPY);
    expect(expected.equals(fs.readFileSync(SSOT))).toBe(true);

    const { app } = buildApp();
    const response = await request(app).get('/api/openapi.yaml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/yaml/);
    expect(Buffer.from(response.text, 'utf8').equals(expected)).toBe(true);
  });
});

describe('GET /api/docs', () => {
  it('is Swagger UI pointed at ./openapi.yaml', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain('./openapi.yaml');
  });
});
