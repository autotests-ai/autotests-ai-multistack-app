# tests-java-gradle-junit5-allure3-selenide

Gradle · JUnit 5 · Allure 3 · Selenide · Rest Assured.

Canonical Java automation module for reference-app-copy block 2 (`test.yml`).

**Not** backend unit tests → `backend/java/backend-java-spring/src/test/java/`.  
**Not** RTL → `frontend/typescript/frontend-typescript-react/src/test/`.

## Siblings (other languages)

| Path | Stack |
|------|-------|
| [`../../javascript/tests-javascript-playwright/`](../../javascript/tests-javascript-playwright/) | Playwright |
| [`../../python/tests-python-selenium/`](../../python/tests-python-selenium/) | pytest · Selenium |

## Layers (block 2)

| Layer | Gradle task | Notes |
|-------|-------------|--------|
| test-infra | `testInfra` | `src/test/java/tests/testinfra/` · `@Layer("test-infra")` + `@Tag("test-infra")` |
| api | `testApi` | Rest Assured |
| integration | `testIntegration` | mount probes (header, login form on SPA) |
| e2e / visual | `testE2e`, `testVisual` | Selenide |

Naming matrix for other Java stacks: [../../NAMING.md](../../NAMING.md).
