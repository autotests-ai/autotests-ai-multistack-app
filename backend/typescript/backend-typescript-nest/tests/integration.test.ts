import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { APP_OPTIONS, configureApp } from '../src/bootstrap';
import { SERVICE_NAME } from '../src/config';
import { applySchema } from '../src/store/schema';
import { PostgresStore } from '../src/store/postgres-store';
import { seedData } from '../src/store/seed';

import { TEST_CONFIG } from './support/app';

const START_TIMEOUT_MS = 120_000;

describe('application wiring on real PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let app: INestApplication;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    const store = new PostgresStore(pool);
    await applySchema(pool);
    await seedData(store);

    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule.forRoot({
          config: { ...TEST_CONFIG, databaseUrl: container.getConnectionUri() },
          store,
        }),
      ],
    }).compile();

    app = configureApp(moduleRef.createNestApplication(APP_OPTIONS));
    await app.init();
  }, START_TIMEOUT_MS);

  afterAll(async () => {
    await app?.close();
    await pool?.end();
    await container?.stop();
  });

  const http = () => request(app.getHttpServer());

  it('GET /api/health reports this module id', async () => {
    const response = await http().get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: SERVICE_NAME });
  });

  it('GET /api/items is served from PostgreSQL seed', async () => {
    const response = await http().get('/api/items');
    expect(response.status).toBe(200);
    expect(response.body.source).toBe('postgresql');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].name).toBe('Alpha');
  });

  it('register → login → me against PostgreSQL', async () => {
    const register = await http()
      .post('/api/auth/register')
      .send({ username: 'pguser', password: 'password123' });
    expect(register.status).toBe(201);
    const token = register.body.token as string;

    const me = await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ username: 'pguser' });

    const login = await http()
      .post('/api/auth/login')
      .send({ username: 'pguser', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.username).toBe('pguser');
  });
});
