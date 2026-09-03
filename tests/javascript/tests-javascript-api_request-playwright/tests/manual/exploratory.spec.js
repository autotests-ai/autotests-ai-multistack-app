const { test } = require('@playwright/test');

test.describe('Exploratory manual', { tag: ['@manual'] }, () => {
  test('Auth happy path across login → home → logout', async () => {
    await test.step('Open /login and sign in as seeded user1 / password1', async () => {});
    await test.step('Confirm welcome panel shows Welcome, user1!', async () => {});
    await test.step('Logout and land on /login with empty session', async () => {});
  });

  test('Items catalogue: content, order and resilience charter', async () => {
    await test.step('Open / and let health + items load', async () => {});
    await test.step(
      'Check items render Alpha, Beta, Gamma in stable id order with descriptions',
      async () => {},
    );
    await test.step('Narrow the viewport to 390px — cards stack, nothing overflows', async () => {});
    await test.step(
      'Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page',
      async () => {},
    );
  });

  test('Session and token edge cases charter', async () => {
    await test.step('Sign in, reload — welcome survives (token in localStorage)', async () => {});
    await test.step(
      'Replace the stored token with garbage in devtools, reload — session is cleared, no crash',
      async () => {},
    );
    await test.step(
      'Sign in in a second tab, logout in the first — observe what the second tab shows on next action',
      async () => {},
    );
    await test.step(
      'Wait for token expiry — expired session degrades to logged-out, not an error page',
      async () => {},
    );
  });
});
