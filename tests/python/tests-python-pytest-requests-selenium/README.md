# tests-python-pytest-requests-selenium

pytest · **Selenium** · Allure 3 · in-cell **requests** (`api` + `ui` + `e2e`).

Python UI school (WebDriver). HTTP in this folder is requests, not httpx. Default CI cell stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/). Sibling Selene combo stays [`tests-python-pytest-requests-selene`](../tests-python-pytest-requests-selene/). HTTP-only requests school stays in [`tests-python-pytest-requests`](../tests-python-pytest-requests/). UI-only Selenium slot: [`tests-python-pytest-selenium`](../tests-python-pytest-selenium/).

## Quick start

```bash
cd tests/python/tests-python-pytest-requests-selenium
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
(`projectKey` `autotests-ai-multistack-app-tests-python-pytest-requests-selenium`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to selenium.

Screenshot tests are two stages, not a pyramid layer. Tree:

`src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true pytest -m screenshot
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_WEBDRIVER_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
pytest -m e2e
```

## Allure

```bash
allure serve allure-results
```
