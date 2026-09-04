# tests-javascript-axios

Vitest · **axios** · Allure 3. HTTP-only school — same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader). No browser, no manual layer.

Titles and JSON schemas match [`tests-typescript-axios`](../../typescript/tests-typescript-axios/). Sibling UI+HTTP block is [`tests-javascript-api_request-playwright`](../tests-javascript-api_request-playwright/) (Playwright **APIRequest**, not Axios). Axios+Playwright clone folder is [`tests-javascript-axios-playwright`](../tests-javascript-axios-playwright/) (`bad-practice`). Do not put Axios inside the living Playwright folder.

```bash
cd tests/javascript/tests-javascript-axios
npm install
cp .env.example .env   # optional; default STAND=prod → autotests.ai
npx vitest run --tagsFilter infra
npx vitest run --tagsFilter infra --coverage
npx vitest run --tagsFilter api
```

CI `sonar-tests` reads `coverage/lcov.info` via [`sonar-project.properties`](sonar-project.properties) (allow-list `config.js`).

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Tags are slices, not stands.

## Allure

```bash
allure serve allure-results
```
