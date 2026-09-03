# JavaScript tests

| Folder | Runner |
|--------|--------|
| `tests-javascript-api_request-playwright/` | **active** — Playwright UI+HTTP (`APIRequest` in-cell, not Axios); `npm run test:infra` = c8; `sonar-tests` |
| `tests-javascript-playwright/` | **active** — **UI-only** Playwright (no REST) |
| `tests-javascript-axios-playwright/` | **bad-practice** — Axios + Playwright; do not fill (living combo is APIRequest) |
| `tests-javascript-cypress/` | slot — UI block Cypress |
| `tests-javascript-axios/` | **active** — HTTP-only Axios (Vitest; sibling of Playwright, not its client) |
| `tests-javascript-k6/` | slot — k6 JavaScript (`layers: [performance]`) |
| `tests-javascript-gatling/` | slot — Gatling JS SDK (`layers: [performance]`) |
