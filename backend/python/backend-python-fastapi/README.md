# backend-python-fastapi

Python FastAPI JSON API — same OpenAPI contract as `backend-java-spring`.
Copy: [`resources/openapi.yaml`](resources/openapi.yaml).
Postgres DB: `multistack_app_python_fastapi`.

**Status:** active.

```
https://autotests.ai/stack/backend-python-fastapi/{frontend}/
https://autotests.ai/stack/backend-python-fastapi/api/
```

Unit tests: `tests/` (SQLite in-memory, Allure `layer=unit`). Integration:
`tests/test_integration.py` — same questions as Java
(`ApplicationWiring` + `AuthLifecycle` on Testcontainers `postgres:16-alpine`).

```bash
python -m pytest -m "not integration"
PYTEST_INTEGRATION=1 python -m pytest -m integration --no-cov
```

Coverage gate: 100% line (`pytest-cov` / coverage.py — JaCoCo analog). CI:
`.github/workflows/ci.yml` (`BACKEND_LANG: python`, `BACKEND_FRAMEWORK: fastapi`).
