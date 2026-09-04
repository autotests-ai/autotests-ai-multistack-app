import type { Server } from 'http';
import request from 'supertest';

import { createManagementServer } from '../src/management';

import { createTestContext } from './support/app';

function listenEphemeral(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

describe('GET /actuator/prometheus on the API port', () => {
  it('is not 200', async () => {
    const { app } = await createTestContext();
    const response = await request(app).get('/actuator/prometheus');
    expect(response.status).not.toBe(200);
  });
});

describe('management server', () => {
  let management: Server | undefined;

  afterEach(async () => {
    if (management) {
      await closeServer(management);
      management = undefined;
    }
  });

  it('serves health and prometheus after an API /api/health', async () => {
    const { app } = await createTestContext();
    const apiHealth = await request(app).get('/api/health');
    expect(apiHealth.status).toBe(200);

    management = await listenEphemeral(createManagementServer());

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
