# Python tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=python`.
Live module (short folder): `tests-python-selenium`.
`TESTS_UI_LIBRARY` selects that suffix (`selenium`), not the Java 5-segment name.

Local (from the module): `pytest -m api` · `pytest -m e2e` · `pytest -m mock` ·
`pytest -m manual` · `pytest -m harness`. Stand is `STAND` / `BASE_URL`, not a marker.

| Verb | Layer |
|------|-------|
| `harness` | pytest helpers (`config` / `api_client` / HAR) |
| `api` | HTTP contract vs live stand (same questions as Java api) |
| `mock` | compose mock stand + pytest `-m mock` |
| `e2e` | pytest + Selenium vs live stand (`-m e2e`, exclude mock/screenshot) |
| `manual` | exploratory stubs in code |
| `sonar` | scan + gate on harness coverage.xml |
