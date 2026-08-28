import { expect, test } from '@playwright/test';
import {
  slash,
  apiRootFrom,
  apiRoot,
  envBool,
  attachFull,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
} from '../../src/helpers/env';
import { username } from '../../src/helpers/api';

test.describe('env helpers', { tag: ['@infra', '@infra_backend'] }, () => {
  test('slash adds trailing slash', () => {
    expect(slash('http://localhost:3000')).toBe('http://localhost:3000/');
  });

  test('slash keeps trailing slash', () => {
    expect(slash('http://localhost:3000/')).toBe('http://localhost:3000/');
  });

  test('slash on empty string is root slash', () => {
    expect(slash('')).toBe('/');
  });

  test('apiRootFrom strips frontend segment', () => {
    expect(
      apiRootFrom('https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/'),
    ).toBe('https://autotests.ai/stack/backend-java-spring');
  });

  test('apiRootFrom keeps backend origin', () => {
    expect(apiRootFrom('https://autotests.ai/stack/backend-java-spring/')).toBe(
      'https://autotests.ai/stack/backend-java-spring',
    );
  });

  test('username fits backend size', () => {
    const name = username();
    expect(name.length).toBeGreaterThanOrEqual(3);
    expect(name.length).toBeLessThanOrEqual(64);
    expect(name.startsWith('user_')).toBeTruthy();
  });

  test('envBool default and truthy tokens', () => {
    const key = 'ZDS_INFRA_ENV_BOOL';
    delete process.env[key];
    expect(envBool(key)).toBe(false);
    expect(envBool(key, true)).toBe(true);
    process.env[key] = 'yes';
    expect(envBool(key)).toBe(true);
    delete process.env[key];
  });

  test('apiRoot prefers API_BASE_URL then UI mount', () => {
    const prev = process.env.API_BASE_URL;
    process.env.API_BASE_URL = 'https://example.test/api-root/';
    expect(apiRoot()).toBe('https://example.test/api-root');
    if (prev === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = prev;
    }
    delete process.env.API_BASE_URL;
    expect(apiRoot()).toMatch(/^https?:\/\//);
    if (prev !== undefined) {
      process.env.API_BASE_URL = prev;
    }
  });

  test('attach flags default off', () => {
    expect(attachFull()).toBe(false);
    expect(attachBrowserConsoleLogs()).toBe(false);
    expect(attachHarLogs()).toBe(false);
    expect(attachLastScreenshot()).toBe(false);
    expect(attachPageSource()).toBe(false);
    expect(attachVideo()).toBe(false);
  });

  test('attach flags honor dedicated env vars', () => {
    const keys = [
      'ATTACH_BROWSER_CONSOLE_LOGS',
      'ATTACH_HAR_LOGS',
      'ATTACH_LAST_SCREENSHOT',
      'ATTACH_PAGE_SOURCE',
      'ATTACH_VIDEO',
    ];
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      for (const k of keys) {
        process.env[k] = 'true';
      }
      expect(attachBrowserConsoleLogs()).toBe(true);
      expect(attachHarLogs()).toBe(true);
      expect(attachLastScreenshot()).toBe(true);
      expect(attachPageSource()).toBe(true);
      expect(attachVideo()).toBe(true);
    } finally {
      for (const k of keys) {
        if (prev[k] === undefined) {
          delete process.env[k];
        } else {
          process.env[k] = prev[k];
        }
      }
    }
  });
});
