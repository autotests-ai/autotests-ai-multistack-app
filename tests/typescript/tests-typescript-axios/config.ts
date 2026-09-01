/** Config loader — STAND / BASE_URL / API_BASE_URL, HTTP-only (no browser). */

import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';

const root = import.meta.dirname;
if (!process.env.CI) {
  loadDotenv({ path: join(root, '.env'), quiet: true });
}

/** Same stands as java `src/test/resources/config/{prod,stage,mock,ci}.properties`. */
const STANDS: Record<string, { baseUrl: string; apiBaseUrl: string }> = {
  prod: {
    baseUrl: 'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/',
    apiBaseUrl: 'https://autotests.ai/stack/backend-java-spring/',
  },
  stage: {
    baseUrl: 'https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/',
    apiBaseUrl: 'https://stage.autotests.ai/stack/backend-java-spring/',
  },
  mock: {
    baseUrl: 'http://127.0.0.1:9911/',
    apiBaseUrl: 'http://127.0.0.1:9911/',
  },
  ci: {
    baseUrl: 'http://127.0.0.1:9821/',
    apiBaseUrl: 'http://127.0.0.1:8800/',
  },
};

export function slash(url: string): string {
  return `${String(url).replace(/\/+$/, '')}/`;
}

export function resolveStand(): string {
  const raw = (process.env.STAND || process.env.ENV || 'prod').trim().toLowerCase();
  return raw in STANDS ? raw : 'prod';
}

export type TestConfig = {
  stand: string;
  baseUrl: string;
  apiBaseUrl: string;
  apiHealthService: string;
};

export function loadConfig(): TestConfig {
  const stand = resolveStand();
  const defaults = STANDS[stand];
  return {
    stand,
    baseUrl: slash(process.env.BASE_URL || defaults.baseUrl),
    apiBaseUrl: slash(process.env.API_BASE_URL || defaults.apiBaseUrl),
    apiHealthService: process.env.API_HEALTH_SERVICE || 'backend-java-spring',
  };
}
