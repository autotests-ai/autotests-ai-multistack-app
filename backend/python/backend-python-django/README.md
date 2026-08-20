# backend-python-django

Python Django JSON API — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `multistack_app_python_django`.

**Status:** active.

```
https://autotests.ai/stack/backend-python-django/{frontend}/
https://autotests.ai/stack/backend-python-django/api/
```

Unit tests: `tests/` (SQLite in-memory). Integration: `tests/test_integration.py`
(Testcontainers PostgreSQL, same image as Java).

```bash
python -m pytest -m "not integration"
PYTEST_INTEGRATION=1 python -m pytest -m integration --no-cov
```

Coverage gate: 100% line (`pytest-cov` / coverage.py — JaCoCo analog). CI:
`.github/workflows/backend_python_github.yml`.
