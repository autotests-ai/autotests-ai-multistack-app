import { DEFAULT_DB_NAME, databaseUrl, loadConfig } from '../src/config';

describe('config', () => {
  it('falls back to the module defaults', () => {
    const config = loadConfig({});

    expect(config.serviceName).toBe('backend-typescript-express');
    expect(config.serverPort).toBe(8080);
    expect(config.databaseUrl).toBe(
      `postgresql://multistack:multistack@localhost:5432/${DEFAULT_DB_NAME}`,
    );
    expect(config.jwtSecret).toBe(
      'reference-app-dev-secret-change-in-production-min-32-chars',
    );
    expect(config.jwtExpirationMs).toBe(86_400_000);
  });

  it('builds the DSN from the DB_* parts', () => {
    expect(
      databaseUrl({
        DB_HOST: 'postgres',
        DB_PORT: '6432',
        DB_NAME: 'other_db',
        DB_USER: 'alice',
        DB_PASSWORD: 'secret',
      }),
    ).toBe('postgresql://alice:secret@postgres:6432/other_db');
  });

  it('lets DATABASE_URL override the parts', () => {
    expect(
      databaseUrl({ DATABASE_URL: 'postgresql://u:p@db:5432/x', DB_HOST: 'ignored' }),
    ).toBe('postgresql://u:p@db:5432/x');
  });

  it('reads the server port and jwt settings from the environment', () => {
    const config = loadConfig({ SERVER_PORT: '18850', JWT_SECRET: 's', JWT_EXPIRATION_MS: '1000' });

    expect(config.serverPort).toBe(18_850);
    expect(config.jwtSecret).toBe('s');
    expect(config.jwtExpirationMs).toBe(1000);
  });
});
