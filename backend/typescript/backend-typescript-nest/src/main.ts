import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';

import { AppModule } from './app.module';
import { APP_OPTIONS, configureApp } from './bootstrap';
import { loadConfig } from './config';
import { PostgresStore } from './store/postgres-store';
import { applySchema } from './store/schema';
import { seedData } from './store/seed';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });

  await applySchema(pool);
  const store = new PostgresStore(pool);
  await seedData(store);

  const app = configureApp(
    await NestFactory.create(AppModule.forRoot({ config, store }), APP_OPTIONS),
  );
  await app.listen(config.serverPort, '0.0.0.0');
  console.log(`${config.serviceName} listening on 0.0.0.0:${config.serverPort}`);

  const shutdown = (): void => {
    void app
      .close()
      .then(() => pool.end())
      .then(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  console.error('startup failed', error);
  process.exit(1);
});
