# Backend — JavaScript

Runtime is Node; **language** in the matrix is `javascript` (same axis as frontend).

Same JSON contract as `backend-java-spring`.

| Module | Port | Status | Notes |
|--------|------|--------|-------|
| [`backend-javascript-express`](backend-javascript-express/) | 8840 | active | [Express](https://expressjs.com/) |
| [`backend-javascript-nest`](backend-javascript-nest/) | 8841 | active | [NestJS](https://nestjs.com/) in JS |

Unit tests: `npm test` in each module.

CI verbs match the default Java stack: unit (Jest + coverage) ·
integration (Testcontainers `postgres:16-alpine`) ·
build / deploy (Docker context = module folder) · Sonar (lcov).
Same orchestrator: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) with
`BACKEND_LANG: javascript` and `BACKEND_FRAMEWORK: express` / `nest`.
Actions: [`backend/javascript/.github/actions/`](.github/actions/).

TypeScript twins: [`../typescript/`](../typescript/) (same stacks, `:8850+`).  
Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).
