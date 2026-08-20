# backend-python-flask

Python Flask JSON API — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Postgres DB: `multistack_app_python_flask`.

**Status:** active.

```
https://autotests.ai/stack/backend-python-flask/{frontend}/
https://autotests.ai/stack/backend-python-flask/api/
```

Unit tests: `tests/` (SQLite in-memory). Integration: `tests/test_integration.py`
(Testcontainers PostgreSQL, same image as Java).

```bash
python -m pytest -m "not integration"
PYTEST_INTEGRATION=1 python -m pytest -m integration --no-cov
```

Coverage gate: 100% line (`pytest-cov` / coverage.py — JaCoCo analog). CI:
`.github/workflows/ci.yml` (`BACKEND_LANG: python`, `BACKEND_FRAMEWORK: flask`).

Shared UI (one `web` image): `/frontend-typescript-react/`, `/frontend-javascript-vanilla/`, …
