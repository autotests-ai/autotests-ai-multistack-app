# Python tests

| Folder | Runner |
|--------|--------|
| `tests-python-selenium/` | **active** — pytest · Selenium · markers (`api` / `e2e` / `mock` / `screenshot` / `manual` / `infra`) |
| `tests-python-selene/` | slot — UI block Selene |
| `tests-python-playwright/` | slot — UI block Playwright |
| `tests-python-requests/` | slot — HTTP block requests |
| `tests-python-httpx/` | **active** — HTTP block httpx (`api` / `infra` / `manual`) |
| `tests-python-yandex-tank/` | slot — Yandex.Tank (`layers: [performance]`) |
| `tests-python-locust/` | slot — Locust (`layers: [performance]`) |

Live CI verbs: `tests/python/.github/actions/{infra,api,mock,e2e,manual,sonar}`.
Short `module_dir`: `tests/python/tests-python-selenium`.
