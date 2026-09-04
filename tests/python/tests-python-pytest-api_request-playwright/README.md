# tests-python-pytest-api_request-playwright

pytest · **Playwright** · Allure 3 · in-cell **APIRequest** (`api` + `ui` + `e2e`).

Python UI school (Playwright `get_by_test_id`, same `data-testid` as Java/TS Playwright). HTTP in this folder is Playwright **APIRequestContext** (`playwright.request`), not requests/httpx. Default CI cell stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/). HTTP-only requests school stays in [`tests-python-pytest-requests`](../tests-python-pytest-requests/). UI-only Playwright slot: [`tests-python-pytest-playwright`](../tests-python-pytest-playwright/). There is no HTTP-only `api_request` folder.

## Quick start

```bash
cd tests/python/tests-python-pytest-api_request-playwright
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m playwright install chromium   # local only; skip when using SELENOID_PLAYWRIGHT_URL
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
(`projectKey` `autotests-ai-multistack-app-tests-python-pytest-api_request-playwright`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to playwright.

Screenshot tests are two stages, not a pyramid layer. Tree:

`src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true pytest -m screenshot
```

## Remote (Selenoid Playwright)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_PLAYWRIGHT_URL='wss://selenoid.qa.guru/playwright/playwright-chromium/1.61.1?accessKey=…'
pytest -m e2e
```

Empty `SELENOID_PLAYWRIGHT_URL` → local Chromium (or `CHROME_BINARY_PATH` = Chrome for Testing). Python wheel is `playwright==1.61.0` (no 1.61.1 on PyPI); the Selenoid WS image stays `playwright-chromium/1.61.1` like the TS cell. Do not pass WebDriver `/wd/hub`.

## Allure

```bash
allure serve allure-results
```
