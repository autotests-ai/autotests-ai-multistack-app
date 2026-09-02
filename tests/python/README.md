# Python tests

| Folder | Runner |
|--------|--------|
| `tests-python-selenium/` | **active** — pytest · Selenium + in-cell requests (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-selene/` | **active** — pytest · Selene + in-cell httpx (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-playwright/` | **active** — pytest · Playwright + APIRequest (`api` / `ui` / `e2e`); pytest-cov **100%** on `config.py` |
| `tests-python-requests/` | **active** — HTTP block requests (`api` / `infra` / `manual`); pytest-cov **100%** on `config.py` |
| `tests-python-httpx/` | **active** — HTTP block httpx (`api` / `infra` / `manual`); `sonar-tests` on `config.py` |
| `tests-python-yandex-tank/` | slot — Yandex.Tank (`layers: [performance]`) |
| `tests-python-locust/` | slot — Locust (`layers: [performance]`) |

Live CI verbs: `tests/python/.github/actions/{infra,api,mock,e2e,manual,sonar}`.
Short `module_dir`: `tests/python/tests-python-selenium`, `tests/python/tests-python-selene`, `tests/python/tests-python-playwright`, `tests/python/tests-python-httpx`, or `tests/python/tests-python-requests`.
Default clone `TESTS_UI_LIBRARY` stays `selenide` (Java).
