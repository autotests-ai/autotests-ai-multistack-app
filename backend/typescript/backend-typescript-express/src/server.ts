import { Pool } from 'pg';

import { createApp } from './app';
import { PostgresStore } from './db/postgres-store';
import { applySchema } from './db/schema';
import { loadConfig } from './config';
import { JwtService } from './security/jwt';
import { seedData } from './seed';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });

  await applySchema(pool);
  const store = new PostgresStore(pool);
  await seedData(store);

  const app = createApp({
    store,
    jwtService: new JwtService(config.jwtSecret, config.jwtExpirationMs),
    serviceName: config.serviceName,
  });

  const server = app.listen(config.serverPort, '0.0.0.0', () => {
    console.log(`${config.serviceName} listening on 0.0.0.0:${config.serverPort}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  console.error('startup failed', error);
  process.exit(1);
});
