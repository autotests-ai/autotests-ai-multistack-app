'use strict';

const ENV_KEYS = [
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'SERVER_PORT',
  'JWT_SECRET',
  'JWT_EXPIRATION_MS',
];

function loadConfig(env = {}) {
  jest.resetModules();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  return require('../src/config');
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('config', () => {
  it('falls back to the module defaults', () => {
    const { config } = loadConfig();
    const settings = config();

    expect(settings.serviceName).toBe('backend-javascript-nest');
    expect(settings.databaseUrl).toBe(
      'postgresql://reference:reference@localhost:5432/reference_app_javascript_nest'
    );
    expect(settings.serverPort).toBe(8080);
    expect(settings.jwtSecret).toBe(
      'reference-app-dev-secret-change-in-production-min-32-chars'
    );
    expect(settings.jwtExpirationMs).toBe(86400000);
    expect(settings.postAuthRedirect).toBe('/');
  });

  it('builds the connection string from the DB_* parts', () => {
    const { databaseUrl } = loadConfig({
      DB_HOST: 'db',
      DB_PORT: '55441',
      DB_NAME: 'other_db',
      DB_USER: 'alice',
      DB_PASSWORD: 'secret',
    });

    expect(databaseUrl()).toBe('postgresql://alice:secret@db:55441/other_db');
  });

  it('lets DATABASE_URL override the parts', () => {
    const { databaseUrl } = loadConfig({
      DATABASE_URL: 'postgresql://u:p@elsewhere:5432/db',
      DB_HOST: 'ignored',
    });

    expect(databaseUrl()).toBe('postgresql://u:p@elsewhere:5432/db');
  });

  it('reads the port and token lifetime as numbers', () => {
    const { config } = loadConfig({
      SERVER_PORT: '18841',
      JWT_EXPIRATION_MS: '60000',
    });
    const settings = config();

    expect(settings.serverPort).toBe(18841);
    expect(settings.jwtExpirationMs).toBe(60000);
  });
});
