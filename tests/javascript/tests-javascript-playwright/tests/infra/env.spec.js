const { test, expect } = require('@playwright/test');
const { slash, apiRootFrom, playwrightWsEndpoint } = require('../../src/helpers/env');
const { username } = require('../../src/helpers/builders');

test.describe('env helpers', { tag: ['@infra', '@infra_backend'] }, () => {
  test('slash adds trailing slash', () => {
    expect(slash('http://localhost:3000')).toBe('http://localhost:3000/');
  });

  test('slash keeps trailing slash', () => {
    expect(slash('http://localhost:3000/')).toBe('http://localhost:3000/');
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

  test('playwrightWsEndpoint prefers SELENOID_PLAYWRIGHT_URL', () => {
    const prevS = process.env.SELENOID_PLAYWRIGHT_URL;
    const prevP = process.env.PW_WS_ENDPOINT;
    process.env.SELENOID_PLAYWRIGHT_URL = 'wss://hub/a';
    process.env.PW_WS_ENDPOINT = 'wss://hub/b';
    try {
      expect(playwrightWsEndpoint()).toBe('wss://hub/a');
    } finally {
      if (prevS === undefined) delete process.env.SELENOID_PLAYWRIGHT_URL;
      else process.env.SELENOID_PLAYWRIGHT_URL = prevS;
      if (prevP === undefined) delete process.env.PW_WS_ENDPOINT;
      else process.env.PW_WS_ENDPOINT = prevP;
    }
  });

  test('playwrightWsEndpoint falls back to PW_WS_ENDPOINT', () => {
    const prevS = process.env.SELENOID_PLAYWRIGHT_URL;
    const prevP = process.env.PW_WS_ENDPOINT;
    delete process.env.SELENOID_PLAYWRIGHT_URL;
    process.env.PW_WS_ENDPOINT = 'wss://hub/b';
    try {
      expect(playwrightWsEndpoint()).toBe('wss://hub/b');
    } finally {
      if (prevS === undefined) delete process.env.SELENOID_PLAYWRIGHT_URL;
      else process.env.SELENOID_PLAYWRIGHT_URL = prevS;
      if (prevP === undefined) delete process.env.PW_WS_ENDPOINT;
      else process.env.PW_WS_ENDPOINT = prevP;
    }
  });
});
