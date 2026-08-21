import { Router } from 'express';

import { readOpenApiResource } from '../openapi-resources';
import type { Store } from '../store';

export interface ApiRouterDeps {
  store: Store;
  serviceName: string;
}

export function createApiRouter(deps: ApiRouterDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: deps.serviceName });
  });

  // Shared contract copy + Swagger UI (same HTML as Java: unpkg + ./openapi.yaml).
  // Not swagger-ui-express: that redirects /docs → /docs/ and breaks the relative spec URL.
  router.get('/openapi.yaml', (_req, res) => {
    res.status(200);
    res.setHeader('Content-Type', 'application/yaml');
    res.end(readOpenApiResource('openapi.yaml'));
  });

  router.get('/docs', (_req, res) => {
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(readOpenApiResource('openapi-docs.html'));
  });

  router.get('/items', async (_req, res) => {
    res.json({ items: await deps.store.listItems(), source: 'postgresql' });
  });

  return router;
}
