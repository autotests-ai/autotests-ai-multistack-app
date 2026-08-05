'use strict';

require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { Logger } = require('@nestjs/common');

const { AppModule } = require('./app.module');
const { configureApp, NEST_OPTIONS } = require('./bootstrap');
const { config } = require('./config');
const { createPgStore } = require('./store');
const { seedData } = require('./seed');

async function main() {
  const settings = config();
  const store = createPgStore(settings.databaseUrl);

  await store.applySchema();
  await seedData(store);

  const app = await NestFactory.create(
    AppModule.register({ store, settings }),
    NEST_OPTIONS
  );
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(settings.serverPort, '0.0.0.0');
  new Logger('Bootstrap').log(
    `${settings.serviceName} listening on 0.0.0.0:${settings.serverPort}`
  );
}

main().catch((error) => {
  new Logger('Bootstrap').error(error);
  process.exit(1);
});
