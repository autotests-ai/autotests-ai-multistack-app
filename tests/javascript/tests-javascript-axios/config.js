/** ConfigReader analog — STAND / BASE_URL / API_BASE_URL, HTTP-only (no browser). */

import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';

const root = import.meta.dirname;
if (!process.env.CI) {
  loadDotenv({ path: join(root, '.env'), quiet: true });
}

/** Same stands as java `src/test/resources/config/{prod,stage,mock,ci}.properties`. */
const STANDS = {
  prod: {
    baseUrl: 'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react',
    apiBaseUrl: 'https://autotests.ai/stack/backend-java-spring/',
  },
  stage: {
    baseUrl: 'https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react',
    apiBaseUrl: 'https://stage.autotests.ai/stack/backend-java-spring/',
  },
  mock: {
    baseUrl: 'http://localhost:9911',
    apiBaseUrl: 'http://localhost:9911/',
  },
  ci: {
    baseUrl: 'http://localhost:9821',
    apiBaseUrl: 'http://localhost:8800/',
  },
};

function withSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function resolveStand() {
  const raw = String(process.env.STAND || process.env.ENV || 'prod')
    .trim()
    .toLowerCase();
  return raw in STANDS ? raw : 'prod';
}

/** Owner-file shape: stored baseUrl has no trailing slash; resolve* adds it. */
export function loadConfig() {
  const stand = resolveStand();
  const defaults = STANDS[stand];
  return {
    stand,
    baseUrl: String(process.env.BASE_URL ?? '').trim() || defaults.baseUrl,
    apiBaseUrl: String(process.env.API_BASE_URL ?? '').trim() || defaults.apiBaseUrl,
    apiHealthService: String(process.env.API_HEALTH_SERVICE ?? '').trim() || 'backend-java-spring',
  };
}

export function configWith(overrides = {}) {
  return {
    stand: overrides.stand ?? '',
    baseUrl: overrides.baseUrl ?? '',
    apiBaseUrl: overrides.apiBaseUrl ?? '',
    apiHealthService: overrides.apiHealthService ?? 'backend-java-spring',
  };
}

export function resolveBaseUrl(config = loadConfig()) {
  const url = String(config.baseUrl ?? '').trim();
  if (url) {
    return withSlash(url);
  }
  throw new Error('Set baseUrl in config/${env}.properties');
}

export function resolveApiBaseUrl(config = loadConfig()) {
  const apiUrl = String(config.apiBaseUrl ?? '').trim();
  if (apiUrl) {
    return withSlash(apiUrl);
  }
  throw new Error('Set apiBaseUrl in config/${env}.properties');
}

/** Java ConfigReader private constructor analog. */
export class ConfigReader {}

export function closedConfigReader() {
  return new ConfigReader();
}
