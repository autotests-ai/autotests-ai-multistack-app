# tests-python-httpx

pytest · **httpx** · Allure 3. HTTP-only school — same `/api` catalog as Java Rest Assured (`5` api + infra + manual). No browser.

Sibling UI block: [`tests-python-selenium`](../tests-python-selenium/). Sibling HTTP slot: [`tests-python-requests`](../tests-python-requests/). Combo with Selenium = generate, not a third folder.

```bash
cd tests/python/tests-python-httpx
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # optional; default STAND=prod → autotests.ai
pytest -m infra
pytest -m infra --cov=config --cov-fail-under=100 --cov-report=term-missing
pytest -m api
pytest -m manual
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Markers are slices, not stands.

## Allure

```bash
allure serve allure-results
```
