import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import request from 'supertest';

import { createApp } from '../src/app';
import { SERVICE_NAME } from '../src/config';
import { applySchema } from '../src/db/schema';
import { PostgresStore } from '../src/db/postgres-store';
import { seedData } from '../src/seed';
import { JwtService } from '../src/security/jwt';

import { TEST_SECRET } from './support/app';

const START_TIMEOUT_MS = 120_000;

describe('application wiring on real PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    const store = new PostgresStore(pool);
    await applySchema(pool);
    await seedData(store);
    app = createApp({
      store,
      jwtService: new JwtService(TEST_SECRET, 86_400_000),
      serviceName: SERVICE_NAME,
    });
  }, START_TIMEOUT_MS);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  it('GET /api/health reports this module id', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: SERVICE_NAME });
  });

  it('GET /api/items is served from PostgreSQL seed', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].name).toBe('Alpha');
  });

  it('register → login → me against PostgreSQL', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ username: 'pguser', password: 'password123' });
    expect(register.status).toBe(201);
    const token = register.body.token as string;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ username: 'pguser' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pguser', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.username).toBe('pguser');
  });
});
