# TypeScript tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=typescript`.
Live modules (short folder): `tests-typescript-playwright` or `tests-typescript-axios`.
`TESTS_UI_LIBRARY` selects that suffix (`playwright` / `axios`), not the Java 5-segment name.

Local Playwright: `npx playwright test --grep @api` ·
`npx playwright test --grep @e2e --grep-invert @screenshot` ·
`npx playwright test --grep @mock` · `npx playwright test --grep @screenshot` ·
`npx playwright test --grep @manual` · `npm run test:infra` (c8, no fail-under).
Local axios: `npx vitest run --tagsFilter infra --coverage`.
Stand is `UI_URL` / `STAND`, not a tag. Screenshot and mock also carry `@e2e` (same dual tag as Java).

| Verb | Layer |
|------|-------|
| `infra` | Playwright helpers + c8, or Vitest `--coverage` on `config.ts` |
| `api` | HTTP contract vs live stand (Playwright `APIRequest` cell; axios cell is Vitest locally) |
| `mock` | compose mock stand + `--grep @mock`, then `--grep @screenshot` (Playwright cell) |
| `e2e` | Playwright vs live stand (`@e2e`, exclude mock/screenshot); screenshot compare like Java |
| `manual` | exploratory stubs in code |
| `sonar` | scan + gate on infra lcov (`sonar-project.properties` in the cell) |
