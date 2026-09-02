# TypeScript tests

| Folder | Runner |
|--------|--------|
| `tests-typescript-playwright/` | **active** — Playwright UI+HTTP (`APIRequest` in-cell, not Axios); `npm run test:infra` = c8; `sonar-tests` |
| `tests-typescript-axios/` | **active** — HTTP block axios (`api` / `infra` / `manual`, Vitest); `sonar-tests` on `config.ts` |
| `tests-typescript-k6/` | slot — k6 TypeScript (`layers: [performance]`) |
| `tests-typescript-gatling/` | slot — Gatling TS SDK (`layers: [performance]`) |
