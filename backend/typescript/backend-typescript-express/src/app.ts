import express, { type Express } from 'express';

import { SERVICE_NAME } from './config';
import { corsMiddleware } from './middleware/cors';
import { apiFallbackHandler, errorHandler, notFoundHandler } from './middleware/errors';
import { jsonBodyParser } from './middleware/json';
import { httpMetricsMiddleware } from './metrics';
import { createApiRouter } from './routes/api';
import { createAuthRouter } from './routes/auth';
import type { JwtService } from './security/jwt';
import type { Store } from './store';

export interface AppDeps {
  store: Store;
  jwtService: JwtService;
  serviceName?: string;
}

/** API-only: every route lives under `/api`, the UI ships as separate nginx images. */
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(httpMetricsMiddleware);
  app.use('/api', corsMiddleware);
  app.use(jsonBodyParser);

  app.use('/api', createApiRouter({ store: deps.store, serviceName: deps.serviceName ?? SERVICE_NAME }));
  app.use('/api/auth', createAuthRouter({ store: deps.store, jwtService: deps.jwtService }));

  app.use('/api', apiFallbackHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
