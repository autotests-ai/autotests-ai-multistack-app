# TypeScript tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=typescript`.
Live module (short folder): `tests-typescript-playwright`.
`TESTS_UI_LIBRARY` selects that suffix (`playwright`), not the Java 5-segment name.

Local (from the module): `npx playwright test --grep @api` ·
`npx playwright test --grep @e2e --grep-invert '@mock|@screenshot'` ·
`npx playwright test --grep @mock` · `npx playwright test --grep @screenshot` ·
`npx playwright test --grep @manual` · `npx playwright test --grep @infra`.
Stand is `UI_URL` / `STAND`, not a tag. Screenshot and mock also carry `@e2e` (same dual tag as Java).

| Verb | Layer |
|------|-------|
| `infra` | Playwright helpers (`env` / `api` / HAR) + c8 |
| `api` | HTTP contract vs live stand (same questions as Java api) |
| `mock` | compose mock stand + `--grep @mock`, then `--grep @screenshot` |
| `e2e` | Playwright vs live stand (`@e2e`, exclude mock/screenshot); screenshot compare like Java |
| `manual` | exploratory stubs in code |
| `sonar` | scan + gate on infra lcov |
