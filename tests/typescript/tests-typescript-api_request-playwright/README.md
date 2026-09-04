# Multistack — tests-typescript-api_request-playwright

Typed sibling of `tests-javascript-api_request-playwright` (`tests/LAYERS.md`): Playwright tags = layers.
Coverage matches the Java default cell (infra → api → e2e including mock/screenshot + session/delete account → manual).
c8 lcov is the JaCoCo analog; Sonar key `autotests-ai-multistack-app-tests-typescript-api_request-playwright`.

## Quick start

```bash
cd tests/typescript/tests-typescript-api_request-playwright
cp .env.example .env   # UI_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react
npm ci
npx playwright install chromium   # local only; skip when using SELENOID_PLAYWRIGHT_URL
npm test                          # @e2e, exclude mock/screenshot
npm run test:api
npm run test:infra                 # c8 lcov (JaCoCo analog, no fail-under)
npm run test:manual
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
