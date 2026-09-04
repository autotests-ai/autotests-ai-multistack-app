'use strict';

const { config } = require('./config');
const { createPgStore } = require('./store');
const { seedData } = require('./seed');
const { createApp } = require('./app');
const { createManagementServer } = require('./management');

async function main() {
  const settings = config();
  const store = createPgStore(settings.databaseUrl);

  await store.applySchema();
  await seedData(store);

  const app = createApp({ store, settings });
  const server = app.listen(settings.serverPort, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(
      `${settings.serviceName} listening on 0.0.0.0:${settings.serverPort}`
    );
  });

  const management = createManagementServer();
  management.listen(settings.managementPort, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(
      `${settings.serviceName} management on 0.0.0.0:${settings.managementPort}`
    );
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(() => {
        management.close(() => {
          store.close().finally(() => process.exit(0));
        });
      });
    });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
