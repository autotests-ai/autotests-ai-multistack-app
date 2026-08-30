# TypeScript tests

| Folder | Runner |
|--------|--------|
| `tests-typescript-playwright/` | **active** — Playwright UI+HTTP (`APIRequest` in-cell, not Axios) |
| `tests-typescript-axios/` | slot — HTTP-only Axios (sibling of Playwright, not its client) |
| `tests-typescript-k6/` | slot — k6 TypeScript (`layers: [performance]`) |
| `tests-typescript-gatling/` | slot — Gatling TS SDK (`layers: [performance]`) |
