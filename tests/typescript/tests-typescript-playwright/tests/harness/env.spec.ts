import { expect, test } from '@playwright/test';
import { slash, apiRootFrom } from '../../src/helpers/env';
import { username } from '../../src/helpers/api';

test.describe('env helpers', { tag: ['@harness', '@harness_backend'] }, () => {
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
});
