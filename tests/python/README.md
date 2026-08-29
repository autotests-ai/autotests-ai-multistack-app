# Python tests

| Folder | Runner |
|--------|--------|
| `tests-python-selenium/` | pytest · Selenium · layers = markers (`api` / `e2e` / `mock` / `screenshot` / `manual` / `infra`) |
| `tests-python-yandex-tank/` | slot — Yandex.Tank (`layers: [performance]`) |
| `tests-python-locust/` | slot — Locust (`layers: [performance]`) |

Live CI verbs: `tests/python/.github/actions/{infra,api,mock,e2e,manual,sonar}`.
Short `module_dir`: `tests/python/tests-python-selenium`.
