import type { Express } from 'express';

import { createApp } from '../../src/app';
import { SERVICE_NAME } from '../../src/config';
import { JwtService } from '../../src/security/jwt';
import { seedData } from '../../src/seed';

import { FakeStore } from './fake-store';

export const TEST_SECRET = 'test-secret-key-at-least-32-characters-long';

export interface TestContext {
  app: Express;
  store: FakeStore;
  jwtService: JwtService;
}

export async function createTestContext(options: { seed?: boolean } = {}): Promise<TestContext> {
  const store = new FakeStore();
  if (options.seed !== false) {
    await seedData(store);
  }
  const jwtService = new JwtService(TEST_SECRET, 86_400_000);
  return {
    app: createApp({ store, jwtService, serviceName: SERVICE_NAME }),
    store,
    jwtService,
  };
}
