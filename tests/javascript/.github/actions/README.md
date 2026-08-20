# JavaScript tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=javascript`.
Live module (short folder): `tests-javascript-playwright`.
`TESTS_UI_LIBRARY` selects that suffix (`playwright`), not the Java 5-segment name.

| Verb | Layer |
|------|-------|
| `e2e` | Playwright UI smoke vs live stand |
| `api` · `harness` · `mock` · `manual` · `sonar` | STOP (not in the live module) |
