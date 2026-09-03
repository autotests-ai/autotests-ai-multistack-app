# tests-javascript-playwright

Playwright · **UI-only** · `layers: [ui, e2e]`. No HTTP client and no `tests/api/`. For students who are not on REST yet.

Combo living (UI+HTTP, in-cell **APIRequest**) stays [`tests-javascript-api_request-playwright`](../tests-javascript-api_request-playwright/). HTTP-only sibling: [`tests-javascript-axios`](../tests-javascript-axios/). Axios+Playwright is [`tests-javascript-axios-playwright`](../tests-javascript-axios-playwright/) (`bad-practice` — do not fill). Default CI stays Java Selenide.

Throwaway register and session cleanup go through the UI (`Delete account`), not APIRequest.

## Quick start

```bash
cd tests/javascript/tests-javascript-playwright
cp .env.example .env   # UI_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react
npm ci
npx playwright install chromium   # local only; skip when using SELENOID_PLAYWRIGHT_URL
npm test                          # @e2e, exclude screenshot
npm run test:ui
npm run test:infra                 # c8 lcov (JaCoCo analog, no fail-under)
npm run test:manual
```

Stand is `UI_URL` / `STAND`, not a tag. There is no `npm run test:api`.

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
