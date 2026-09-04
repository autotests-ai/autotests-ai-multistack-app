# tests-python-pytest-httpx

pytest · **httpx** · Allure 3. HTTP-only school — same `/api` catalog as Java Rest Assured (`5` api + infra). No browser, no manual layer. Not a UI in-cell client: Selenium/Selene combos use **requests**; Playwright combo uses **APIRequest**.

Sibling HTTP school: [`tests-python-pytest-requests`](../tests-python-pytest-requests/). UI combos: [`tests-python-pytest-requests-selenium`](../tests-python-pytest-requests-selenium/), [`tests-python-pytest-requests-selene`](../tests-python-pytest-requests-selene/), [`tests-python-pytest-api_request-playwright`](../tests-python-pytest-api_request-playwright/). Combo with a UI school = generate, not a third folder.

```bash
cd tests/python/tests-python-pytest-httpx
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # optional; default STAND=prod → autotests.ai
pytest -m infra
pytest -m infra --cov=config --cov-fail-under=100 --cov-report=term-missing
pytest -m api
```

CI `sonar-tests` reads `coverage.xml` via [`sonar-project.properties`](sonar-project.properties).

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Markers are slices, not stands.

## Allure

```bash
allure serve allure-results
```
