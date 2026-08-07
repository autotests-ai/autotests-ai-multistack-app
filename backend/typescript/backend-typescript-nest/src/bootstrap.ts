import type { INestApplication, NestApplicationOptions } from '@nestjs/common';

import { MessageExceptionFilter } from './common/message.filter';

/** Creation options `main.ts` and the tests share: `rawBody` is what `@JsonBody()` reads. */
export const APP_OPTIONS: NestApplicationOptions = { rawBody: true };

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
