# Backend — Python

| Module | Status | Notes |
|--------|--------|-------|
| [`backend-python-flask`](backend-python-flask/) | active | Flask + SQLAlchemy + JWT |
| [`backend-python-fastapi`](backend-python-fastapi/) | active | FastAPI + SQLAlchemy + JWT |
| [`backend-python-django`](backend-python-django/) | active | Django + JWT |

Same JSON contract as `backend-java-spring`. Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).

CI verbs match the default Java stack: unit (pytest + coverage.py 100% line) ·
integration (Testcontainers `postgres:16-alpine`) · Sonar (`coverage.xml`).
Workflow: [`.github/workflows/backend_python_github.yml`](../../.github/workflows/backend_python_github.yml).
Teaching `ci.yml` stays on `backend-java-spring`.
