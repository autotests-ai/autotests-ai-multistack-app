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
pytest -m e2e
pytest -m manual
pytest -m harness
STAND=mock pytest -m mock   # docker compose --profile mock up -d stand-gateway first
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Markers are slices, not stands.

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export REMOTE_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
pytest -m e2e
```

## Allure

```bash
allure serve allure-results
```

Jenkins freestyle: `autotests-ai-multistack-tests-freestyle-python-allure3`.
