import { epic, severity, step } from 'allure-js-commons';
import { beforeEach, describe, test } from 'vitest';

describe('Exploratory manual', { tags: ['manual'] }, () => {
  beforeEach(async () => {
    await epic('Exploratory');
    await severity('normal');
  });

  test('Auth happy path across login → home → logout', async () => {
    await step('Open /login and sign in as seeded user1 / password1', async () => {});
    await step('Confirm welcome panel shows Welcome, user1!', async () => {});
    await step('Logout and land on /login with empty session', async () => {});
  });

  test('Items catalogue: content, order and resilience charter', async () => {
    await step('Open / and let health + items load', async () => {});
    await step(
      'Check items render Alpha, Beta, Gamma in stable id order with descriptions',
      async () => {},
    );
    await step('Narrow the viewport to 390px — cards stack, nothing overflows', async () => {});
    await step(
      'Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page',
      async () => {},
    );
  });

  test('Session and token edge cases charter', async () => {
    await step('Sign in, reload — welcome survives (token in localStorage)', async () => {});
    await step(
      'Replace the stored token with garbage in devtools, reload — session is cleared, no crash',
      async () => {},
    );
    await step(
      'Sign in in a second tab, logout in the first — observe what the second tab shows on next action',
      async () => {},
    );
    await step(
      'Wait for token expiry — expired session degrades to logged-out, not an error page',
      async () => {},
    );
  });
});
