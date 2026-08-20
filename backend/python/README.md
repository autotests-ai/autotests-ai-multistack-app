# Backend — Python

| Module | Status | Notes |
|--------|--------|-------|
| [`backend-python-flask`](backend-python-flask/) | active | Flask + SQLAlchemy + JWT |
| [`backend-python-fastapi`](backend-python-fastapi/) | active | FastAPI + SQLAlchemy + JWT |
| [`backend-python-django`](backend-python-django/) | active | Django + JWT |

Same JSON contract as `backend-java-spring`. Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).

CI verbs match the default Java stack: unit (pytest + coverage.py 100% line) ·
integration (Testcontainers `postgres:16-alpine`) · Sonar (`coverage.xml`).
Same orchestrator: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) with
`BACKEND_LANG: python` and `BACKEND_FRAMEWORK: flask` / `fastapi` / `django`.
Actions: [`backend/python/.github/actions/`](.github/actions/).
