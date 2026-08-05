import { Router } from 'express';

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

  router.get('/items', async (_req, res) => {
    res.json({ items: await deps.store.listItems(), source: 'postgresql' });
  });

  return router;
}
