import type { INestApplication } from '@nestjs/common';

import { MessageExceptionFilter } from './common/message.filter';

/** Shared by `main.ts` and the tests so both exercise the same HTTP surface. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new MessageExceptionFilter());
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization'],
    credentials: false,
  });
  return app;
}
