# tests-typescript-axios

Vitest · **axios** · Allure 3. HTTP-only school — same `/api` catalog as Java Rest Assured (`5` api + infra). No browser, no manual layer.

Titles and JSON schemas match [`tests-typescript-api_request-playwright`](../tests-typescript-api_request-playwright/) `tests/api` (Playwright **APIRequest** stays there). Sibling UI+HTTP block is that Playwright cell. Sibling HTTP school: [`tests-javascript-axios`](../../javascript/tests-javascript-axios/). Combo with Playwright = generate, not a third folder.

```bash
cd tests/typescript/tests-typescript-axios
npm install
cp .env.example .env   # optional; default STAND=prod → autotests.ai
npx vitest run --tagsFilter infra
npx vitest run --tagsFilter infra --coverage
npx vitest run --tagsFilter api
```

CI `sonar-tests` reads `coverage/lcov.info` via [`sonar-project.properties`](sonar-project.properties) (allow-list `config.ts`).

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Tags are slices, not stands.

## Allure

```bash
allure serve allure-results
```
