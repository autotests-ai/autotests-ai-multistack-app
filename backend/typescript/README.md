# Backend — TypeScript

Runtime is Node; **language** in the matrix is `typescript` (same axis as frontend).

Same JSON contract as `backend-java-spring`.

| Module | Port | Status | Notes |
|--------|------|--------|-------|
| [`backend-typescript-express`](backend-typescript-express/) | 8850 | active | [Express](https://expressjs.com/) + TypeScript |
| [`backend-typescript-nest`](backend-typescript-nest/) | 8851 | active | [NestJS](https://nestjs.com/) |

Unit tests: `npm test` in each module.

JavaScript twins: [`../javascript/`](../javascript/) (same stacks, `:8840+`).  
Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).
