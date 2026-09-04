# Python tests

UI-only slots keep the runner: `tests-python-pytest-{selenium,selene,playwright}` (no REST). Selenium/Selene combo living cells put requests first: `tests-python-pytest-requests-{selenium,selene}`. Playwright combo is `tests-python-pytest-api_request-playwright` (APIRequest, same tail as JS/TS). httpx is HTTP-only — not a UI in-cell client.

| Folder | Runner |
|--------|--------|
| `tests-python-pytest-requests-selenium/` | **active** — pytest · Selenium + in-cell requests (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-pytest-requests-selene/` | **active** — pytest · Selene + in-cell requests (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-pytest-api_request-playwright/` | **active** — pytest · Playwright + in-cell APIRequest (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-pytest-selenium/` | slot — **UI-only** Selenium (no REST) |
| `tests-python-pytest-selene/` | slot — **UI-only** Selene (no REST) |
| `tests-python-pytest-playwright/` | slot — **UI-only** Playwright (no REST) |
| `tests-python-pytest-requests/` | **active** — HTTP block requests (`api` / `infra`, no `manual`); pytest-cov **100%** on `config.py` |
| `tests-python-pytest-httpx/` | **active** — HTTP block httpx (`api` / `infra`, no `manual`); `sonar-tests` on `config.py` |
| `tests-python-yandex_tank/` | slot — Yandex.Tank (`layers: [performance]`) |
| `tests-python-locust/` | slot — Locust (`layers: [performance]`) |

Live CI verbs: `tests/python/.github/actions/{infra,api,mock,e2e,manual,sonar}`.
Combo `module_dir`: `tests/python/tests-python-pytest-requests-selenium`, `tests/python/tests-python-pytest-requests-selene`, `tests/python/tests-python-pytest-api_request-playwright`, `tests/python/tests-python-pytest-httpx`, or `tests/python/tests-python-pytest-requests`.
Default clone `TESTS_UI_LIBRARY` stays `selenide` (Java).
