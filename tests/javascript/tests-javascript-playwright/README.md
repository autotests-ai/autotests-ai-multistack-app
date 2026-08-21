# Multistack — tests-javascript-playwright

Layers match `tests/LAYERS.md` / Java default cell: harness → api → e2e (mock/screenshot inside e2e) → manual. App facade + page objects stay for UI.

## Quick start

```bash
cd tests/javascript/tests-javascript-playwright
cp .env.example .env   # UI_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react
npm ci
npx playwright install chromium   # local only; skip when using SELENOID_PLAYWRIGHT_URL
npm test                          # @e2e, exclude mock/screenshot
npm run test:api
npm run test:harness
npm run test:manual
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
