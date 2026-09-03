# JavaScript tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=javascript`.
Living combo: `tests-javascript-api_request-playwright`. UI-only living: `tests-javascript-playwright`. Axios+Playwright is `tests-javascript-axios-playwright` (`bad-practice`).

Local (from the combo module): `npx playwright test --grep @api` ·
`npx playwright test --grep @e2e --grep-invert @screenshot` ·
`npx playwright test --grep @mock` · `npx playwright test --grep @screenshot` ·
`npx playwright test --grep @manual` · `npm run test:infra` (c8, no fail-under).
UI-only has no `@api`. Stand is `UI_URL` / `STAND`, not a tag. Screenshot and mock also carry `@e2e` (same dual tag as Java).

| Verb | Layer |
|------|-------|
| `infra` | Playwright helpers (`env` / HAR; combo also `api.js`) + c8 |
| `api` | HTTP contract vs live stand (skipped when the cell has no `tests/api`) |
| `mock` | compose mock stand + `--grep @mock`, then `--grep @screenshot` |
| `e2e` | Playwright vs live stand (`@e2e`, exclude mock/screenshot); screenshot compare like Java |
| `manual` | exploratory stubs in code |
| `sonar` | scan + gate on infra lcov |
