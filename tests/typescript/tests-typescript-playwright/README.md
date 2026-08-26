# Multistack — tests-typescript-playwright

Typed sibling of `tests-javascript-playwright` (`tests/LAYERS.md`): Playwright tags = layers.
App facade + page objects stay for UI. Living first slice: e2e UI (seed login `user1`) + harness env.

## Quick start

```bash
cd tests/typescript/tests-typescript-playwright
cp .env.example .env   # UI_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react
npm ci
npx playwright install chromium   # local only; skip when using SELENOID_PLAYWRIGHT_URL
npm test                          # @e2e, exclude mock/screenshot
npm run test:harness
npm run typecheck
```

Stand is `UI_URL` / `STAND` / `API_BASE_URL`, not a tag.

## Remote (Selenoid Playwright)

```bash
export UI_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react
export SELENOID_PLAYWRIGHT_URL='wss://selenoid.qa.guru/playwright/playwright-chromium/1.61.1?accessKey=…'
npm test
```

Empty `SELENOID_PLAYWRIGHT_URL` → local Chromium. The Playwright WS image tag must match `@playwright/test`.

## Allure

```bash
npm run allureG && npm run allureO
```

Results: `allure-results/`.
