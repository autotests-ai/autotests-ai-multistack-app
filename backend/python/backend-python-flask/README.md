# backend-python-flask

Python Flask JSON API — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Copy: [`resources/openapi.yaml`](resources/openapi.yaml).
Postgres DB: `multistack_app_python_flask`.

**Status:** active.

```
https://autotests.ai/stack/backend-python-flask/{frontend}/
https://autotests.ai/stack/backend-python-flask/api/
```

Unit tests: `tests/` (SQLite in-memory, Allure `layer=unit`). Integration:
`tests/test_integration.py` — same questions as Java
(`ApplicationWiring` + `AuthLifecycle` on Testcontainers `postgres:16-alpine`).

```bash
python -m pytest -m "not integration"
PYTEST_INTEGRATION=1 python -m pytest -m integration --no-cov
```

Coverage gate: 100% line (`pytest-cov` / coverage.py — JaCoCo analog). CI:
`.github/workflows/ci.yml` (`BACKEND_LANG: python`, `BACKEND_FRAMEWORK: flask`).

Shared UI (one `web` image): `/frontend-typescript-react/`, `/frontend-javascript-vanilla/`, …
