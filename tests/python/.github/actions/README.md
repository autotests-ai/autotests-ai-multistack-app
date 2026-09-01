# Python tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=python`.
Live module (short folder): `tests-python-selenium`.
`TESTS_UI_LIBRARY` selects that suffix (`selenium`), not the Java 5-segment name.

Local (from the module): `pytest -m api` · `pytest -m 'e2e and not screenshot and not mock'` ·
`pytest -m mock` · `pytest -m screenshot` · `pytest -m manual` · `pytest -m infra` (`--cov` report, no fail-under).
Stand is `STAND` / `BASE_URL`, not a marker. Screenshot and mock also carry `e2e` (same dual tag as Java).

| Verb | Layer |
|------|-------|
| `infra` | pytest helpers (`config` / `api_client` / HAR) + pytest-cov (no fail-under) |
| `api` | HTTP contract vs live stand (same questions as Java api) |
| `mock` | compose mock stand + pytest `-m mock`, then `-m screenshot` (compare; rewrite if `update_screenshots`) |
| `e2e` | pytest + Selenium vs live stand (`-m e2e`, exclude mock/screenshot); screenshot compare like Java |
| `manual` | exploratory stubs in code |
| `sonar` | scan + gate on infra coverage.xml |
