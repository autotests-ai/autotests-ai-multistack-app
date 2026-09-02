# tests-python-selene

pytest · **Selene** · Allure 3 · in-cell **httpx** (`api` + `ui` + `e2e`).

Python UI school (Selenide-like). HTTP in this folder is httpx (same client as `tests-python-httpx`), not a second clone folder. Default CI cell stays [`tests-java-gradle-junit5-allure3-selenide`](../../java/tests-java-gradle-junit5-allure3-selenide/). Sibling Selenium UI block stays [`tests-python-selenium`](../tests-python-selenium/). HTTP-only httpx school stays in the sibling folder.

## Quick start

```bash
cd tests/python/tests-python-selene
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
(`projectKey` `autotests-ai-multistack-app-tests-python-selene`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to selene.

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
