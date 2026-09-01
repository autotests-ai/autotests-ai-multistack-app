# Multistack — tests-python-selenium (Selenium)

Pyramid matching the Java default cell (`tests/LAYERS.md`): markers = layers.
Fluent page objects, pytest + allure-pytest, `conftest` ≈ `TestBase`.

## Quick start

```bash
cd tests-python-selenium
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
pytest -m api
pytest -m 'e2e and not screenshot and not mock'
pytest -m manual
pytest -m infra
pytest -m infra --cov=config --cov=api_client --cov=har_capture --cov-report=term-missing
# report only — CI has no fail-under (not coverage theatre)
STAND=mock pytest -m mock   # docker compose --profile mock up -d stand-gateway first
STAND=mock pytest -m screenshot   # PNG compare vs mock/; omit SCREENSHOT_OS on a Mac
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Markers are slices, not stands.

Screenshot tests are **inside e2e**, not a pyramid layer (`e2e` + `screenshot`, Allure `layer=e2e`). Tree:

`src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux` — that would write Linux-canon PNGs from macOS Chrome. Omit it (writes `macos`) or set `SCREENSHOT_OS=macos`.

```bash
# Local mock refresh (macos folder on Darwin)
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

Jenkins freestyle: `autotests-ai-multistack-tests-freestyle-python-allure3`.
