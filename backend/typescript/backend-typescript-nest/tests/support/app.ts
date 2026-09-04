import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { APP_OPTIONS, configureApp } from '../../src/bootstrap';
import { SERVICE_NAME, type AppConfig } from '../../src/config';
import { JwtService } from '../../src/security/jwt.service';
import { seedData } from '../../src/store/seed';

import { FakeStore } from './fake-store';

export const TEST_SECRET = 'test-secret-key-at-least-32-characters-long';

export const TEST_CONFIG: AppConfig = {
  serviceName: SERVICE_NAME,
  serverPort: 8080,
  managementPort: 8081,
  databaseUrl: 'postgresql://unused',
  jwtSecret: TEST_SECRET,
  jwtExpirationMs: 86_400_000,
};

export interface TestContext {
  app: INestApplication;
  store: FakeStore;
  jwtService: JwtService;
}

export async function createTestApp(options: { seed?: boolean } = {}): Promise<TestContext> {
  const store = new FakeStore();
  if (options.seed !== false) {
    await seedData(store);
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot({ config: TEST_CONFIG, store })],
  }).compile();

  const app = configureApp(moduleRef.createNestApplication(APP_OPTIONS));
  await app.init();

  return { app, store, jwtService: app.get(JwtService) };
}
