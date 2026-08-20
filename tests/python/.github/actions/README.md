# Python tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=python`.
Live module (short folder): `tests-python-selenium`.
`TESTS_UI_LIBRARY` selects that suffix (`selenium`), not the Java 5-segment name.

| Verb | Layer |
|------|-------|
| `e2e` | pytest + Selenium UI smoke vs live stand |
| `api` · `harness` · `mock` · `manual` · `sonar` | STOP (not in the live module) |
