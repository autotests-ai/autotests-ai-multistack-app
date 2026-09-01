import { epic, severity } from 'allure-js-commons';
import { beforeEach, describe, expect, test } from 'vitest';
import { apiBase, apiRoot, newClient, username } from '../../api-client';
import { loadConfig } from '../../config';

describe('api_client', { tags: ['infra', 'infra_backend'] }, () => {
  beforeEach(async () => {
    await epic('Test infra');
    await severity('normal');
  });

  test('api_root strips frontend segment', () => {
    expect(
      apiRoot('https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/'),
    ).toBe('https://autotests.ai/stack/backend-java-spring');
  });

  test('api_root keeps backend origin', () => {
    expect(apiRoot('https://autotests.ai/stack/backend-java-spring/')).toBe(
      'https://autotests.ai/stack/backend-java-spring',
    );
  });

  test('username fits backend size', () => {
    const name = username();
    expect(name.length).toBeGreaterThanOrEqual(3);
    expect(name.length).toBeLessThanOrEqual(64);
    expect(name.startsWith('user_')).toBe(true);
  });

  test('new_client is axios', () => {
    const cfg = loadConfig();
    const client = newClient(cfg);
    expect(typeof client.request).toBe('function');
    expect(client.defaults.baseURL).toBe(apiBase(cfg));
    expect(client.defaults.validateStatus?.(401)).toBe(true);
  });
});
