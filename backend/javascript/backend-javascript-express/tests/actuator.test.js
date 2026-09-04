'use strict';

const request = require('supertest');

const { createManagementServer } = require('../src/management');
const { buildApp } = require('./helpers');

function listenEphemeral(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

describe('GET /actuator/prometheus on the API port', () => {
  it('is not 200', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/actuator/prometheus');
    expect(response.status).not.toBe(200);
  });
});

describe('management server', () => {
  let management;

  afterEach(async () => {
    if (management) {
      await closeServer(management);
      management = undefined;
    }
  });

  it('serves health and prometheus after an API /api/health', async () => {
    const { app } = buildApp();
    const apiHealth = await request(app).get('/api/health');
    expect(apiHealth.status).toBe(200);

    management = createManagementServer();
    await listenEphemeral(management);

    const health = await request(management).get('/actuator/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'UP' });

    const prometheus = await request(management).get('/actuator/prometheus');
    expect(prometheus.status).toBe(200);
    expect(prometheus.text).toContain('http_server_requests_seconds');
    expect(prometheus.text).toContain('uri="/api/health"');
    expect(prometheus.text).toContain('status="200"');
  });
});
