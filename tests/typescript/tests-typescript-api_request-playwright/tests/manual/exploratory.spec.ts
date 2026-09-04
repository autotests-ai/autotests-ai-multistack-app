import { test } from '@playwright/test';

test.describe('Exploratory manual', { tag: ['@manual'] }, () => {
  test('Home residual: 390px viewport and offline error', async () => {
    await test.step('Open / and let health + items load', async () => {});
    await test.step('Narrow the viewport to 390px — cards stack, nothing overflows', async () => {});
    await test.step(
      'Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page',
      async () => {},
    );
  });

  test('Security residual: XSS, second tab, JWT expiry', async () => {
    await test.step('Register with an XSS / HTML payload in the username — Welcome panel and header show escaped text, no alert', async () => {});
    await test.step(
      'Sign in in a second tab, logout in the first — observe what the second tab shows on next action',
      async () => {},
    );
    await test.step(
      'Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page',
      async () => {},
    );
  });
});
