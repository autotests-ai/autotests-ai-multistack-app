# Backend — Kotlin

| Module | Status | Notes |
|--------|--------|-------|
| [`backend-kotlin-spring`](backend-kotlin-spring/) | active | Spring Boot 3 · Gradle · Postgres · JWT — same OpenAPI as Java |

Same JSON contract as `backend-java-spring`. Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).

CI verbs match the default Java stack: unit (Gradle + JaCoCo 100% line) ·
integration (Testcontainers `postgres:16-alpine`, wiring + auth lifecycle) ·
build / deploy (Docker context = module folder) · Sonar (JaCoCo XML).
Contract copy: `{module}/resources/openapi.yaml` (SSOT `_contract/openapi.yaml`).
Same orchestrator: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) with
`BACKEND_LANG: kotlin` and `BACKEND_FRAMEWORK: spring`.
Actions: [`backend-kotlin-spring/.github/actions/`](backend-kotlin-spring/.github/actions/).
