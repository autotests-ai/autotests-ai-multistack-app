# tests-python-pytest-requests-selene

pytest · **Selene** · Allure 3 · in-cell **requests** (`api` + `ui` + `e2e`).

Python UI school (Selenide-like). HTTP in this folder is requests (same client as [`tests-python-pytest-requests`](../tests-python-pytest-requests/) and [`tests-python-pytest-requests-selenium`](../tests-python-pytest-requests-selenium/)), not httpx. Default CI cell stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/). HTTP-only httpx school stays in [`tests-python-pytest-httpx`](../tests-python-pytest-httpx/). UI-only Selene slot: [`tests-python-pytest-selene`](../tests-python-pytest-selene/).

## Quick start

```bash
cd tests/python/tests-python-pytest-requests-selene
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # optional; default STAND=prod
pytest -m infra
pytest -m infra --cov=config --cov-fail-under=100 --cov-report=term-missing
pytest -m api
STAND=mock pytest -m 'ui and not screenshot'
STAND=mock pytest -m screenshot
pytest -m 'e2e and not screenshot'
pytest -m manual
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Markers are slices, not stands.

CI `sonar-tests` reads `coverage.xml` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-python-pytest-requests-selene`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to selene.

Screenshot tests are two stages, not a pyramid layer. Tree:

`src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true pytest -m screenshot
```

## Allure

```bash
allure serve allure-results
```
