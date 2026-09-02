import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  ConfigReader,
  closedConfigReader,
  configWith,
  loadConfig,
  resolveApiBaseUrl,
  resolveBaseUrl,
} from '../../config.js';

function withEnv(overrides, fn) {
  const prev = {};
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

function usingCiStand(fn) {
  withEnv(
    { STAND: 'ci', ENV: 'ci', BASE_URL: '', API_BASE_URL: '', API_HEALTH_SERVICE: '' },
    fn,
  );
}

describe('ConfigReader', { tags: ['infra', 'infra_backend'] }, () => {
  beforeEach(async () => {
    await epic('Test infra');
    await severity('normal');
  });

  test('resolveBaseUrl adds trailing slash to HTTP baseUrl', () => {
    const config = configWith({ baseUrl: 'http://localhost:3000' });
    expect(resolveBaseUrl(config)).toBe('http://localhost:3000/');
  });

  test('resolveBaseUrl keeps trailing slash on baseUrl', () => {
    const config = configWith({ baseUrl: 'http://localhost:3000/' });
    expect(resolveBaseUrl(config)).toBe('http://localhost:3000/');
  });

  test('resolveBaseUrl fails fast when baseUrl is empty', () => {
    const config = configWith({ baseUrl: '' });
    expect(() => resolveBaseUrl(config)).toThrow(/Set baseUrl/);
  });

  test('resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl', () => {
    const config = configWith({ apiBaseUrl: 'http://api.example.com' });
    expect(resolveApiBaseUrl(config)).toBe('http://api.example.com/');
  });

  test('resolveApiBaseUrl fails fast when apiBaseUrl is empty', () => {
    const config = configWith({ apiBaseUrl: '' });
    expect(() => resolveApiBaseUrl(config)).toThrow(/Set apiBaseUrl/);
  });

  test('loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)', () => {
    usingCiStand(() => {
      expect(loadConfig().baseUrl).toBe('http://localhost:9821');
    });
  });

  test('resolveBaseUrl uses loaded config', () => {
    usingCiStand(() => {
      expect(resolveBaseUrl()).toBe('http://localhost:9821/');
    });
  });

  test('resolveApiBaseUrl uses loaded config', () => {
    usingCiStand(() => {
      expect(resolveApiBaseUrl()).toBe('http://localhost:8800/');
    });
  });

  test('private constructor keeps utility class closed', () => {
    expect(closedConfigReader()).toBeInstanceOf(ConfigReader);
  });
});
