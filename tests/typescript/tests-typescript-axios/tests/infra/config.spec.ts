import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { loadConfig, resolveStand, slash } from '../../config';

function withEnv(overrides: Record<string, string | undefined>, fn: () => void): void {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    prev[key] = process.env[key];
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(overrides)) {
      if (prev[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev[key];
      }
    }
  }
}

describe('config', { tags: ['infra', 'infra_backend'] }, () => {
  beforeEach(async () => {
    await epic('Test infra');
    await severity('normal');
  });

  test('slash adds trailing slash', () => {
    expect(slash('http://localhost:3000')).toBe('http://localhost:3000/');
  });

  test('slash keeps trailing slash', () => {
    expect(slash('http://localhost:3000/')).toBe('http://localhost:3000/');
  });

  test('resolve_stand defaults to prod', () => {
    withEnv({ STAND: undefined, ENV: undefined }, () => {
      expect(resolveStand()).toBe('prod');
    });
  });

  test('resolve_stand accepts ci', () => {
    withEnv({ STAND: 'ci' }, () => {
      expect(resolveStand()).toBe('ci');
    });
  });

  test('resolve_stand unknown falls back to prod', () => {
    withEnv({ STAND: 'lab' }, () => {
      expect(resolveStand()).toBe('prod');
    });
  });

  test('load_config ci api is 8800', () => {
    withEnv({ STAND: 'ci', BASE_URL: undefined, API_BASE_URL: undefined }, () => {
      const cfg = loadConfig();
      expect(cfg.stand).toBe('ci');
      expect(cfg.baseUrl).toBe('http://127.0.0.1:9821/');
      expect(cfg.apiBaseUrl).toBe('http://127.0.0.1:8800/');
    });
  });

  test('load_config prod urls', () => {
    withEnv({ STAND: 'prod', BASE_URL: undefined, API_BASE_URL: undefined }, () => {
      const cfg = loadConfig();
      expect(cfg.stand).toBe('prod');
      expect(cfg.apiBaseUrl).toBe('https://autotests.ai/stack/backend-java-spring/');
    });
  });

  test('load_config explicit base url wins', () => {
    withEnv(
      { STAND: 'prod', BASE_URL: 'http://127.0.0.1:9999', API_BASE_URL: 'http://127.0.0.1:8888' },
      () => {
        const cfg = loadConfig();
        expect(cfg.baseUrl).toBe('http://127.0.0.1:9999/');
        expect(cfg.apiBaseUrl).toBe('http://127.0.0.1:8888/');
      },
    );
  });
});
