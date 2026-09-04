# tests-python-pytest-requests

pytest · **requests** · Allure 3. HTTP-only school — same `/api` catalog as Java Rest Assured (`31` api + `9` ConfigReader). No browser, no manual layer. Not httpx.

Sibling UI combos: [`tests-python-pytest-requests-selenium`](../tests-python-pytest-requests-selenium/) and [`tests-python-pytest-requests-selene`](../tests-python-pytest-requests-selene/) (requests in-cell). Playwright combo is [`tests-python-pytest-api_request-playwright`](../tests-python-pytest-api_request-playwright/) (APIRequest, not requests). Sibling HTTP school: [`tests-python-pytest-httpx`](../tests-python-pytest-httpx/). Combo with a UI school = generate, not a third folder.

```bash
cd tests/python/tests-python-pytest-requests
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # optional; default STAND=prod → autotests.ai
pytest -m infra
pytest -m infra --cov=config --cov-fail-under=100 --cov-report=term-missing
pytest -m api
```

CI `sonar-tests` reads `coverage.xml` via [`sonar-project.properties`](sonar-project.properties) (`projectKey` `autotests-ai-multistack-app-tests-python-pytest-requests`).

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Markers are slices, not stands.

Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to python requests.

## Allure

```bash
allure serve allure-results
```
