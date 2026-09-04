import type { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { load } from 'js-yaml';

import { MessageExceptionFilter } from './common/message.filter';
import { HttpMetricsInterceptor } from './common/http-metrics.interceptor';
import { readOpenApiResource } from './openapi-resources';

/** Creation options `main.ts` and the tests share: `rawBody` is what `@JsonBody()` reads. */
export const APP_OPTIONS: NestApplicationOptions = { rawBody: true };

function setupOpenApiUi(app: INestApplication): void {
  const document = load(readOpenApiResource('openapi.yaml').toString('utf8')) as OpenAPIObject;
  // UI over the file copy. Not DocumentBuilder / decorator scan.
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'autotests-ai-multistack-app API',
    ui: true,
    raw: false,
  });
}

/** Shared by `main.ts` and the tests so both exercise the same HTTP surface. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new HttpMetricsInterceptor());
  app.useGlobalFilters(new MessageExceptionFilter());
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization'],
    credentials: false,
  });
  setupOpenApiUi(app);
  return app;
}
