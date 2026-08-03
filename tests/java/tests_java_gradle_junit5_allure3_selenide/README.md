# tests_java_gradle_junit5_allure3_selenide

Gradle · JUnit 5 · Allure 3 · Selenide · Rest Assured.

Canonical Java automation module for reference-app-copy block 2 (`test.yml`).

**Not** backend unit tests → `backend/java/backend_java_spring/src/test/java/`.  
**Not** RTL → `frontend/typescript/frontend_typescript_react-testing-library/`.

## Siblings (other languages)

| Path | Stack |
|------|-------|
| [`../../javascript/tests_javascript_playwright/`](../../javascript/tests_javascript_playwright/) | Playwright |
| [`../../python/tests_python_selenium/`](../../python/tests_python_selenium/) | pytest · Selenium |

## Layers (block 2)

| Layer | Gradle task | Notes |
|-------|-------------|--------|
| helpers unit | `testUnit` | config/helpers in this module |
| api | `testApi` | Rest Assured |
| integration | `testIntegration` | mount probes |
| component (browser) | `testComponent` | preview on :3000 |
| e2e / visual | `testE2e`, `testVisual` | Selenide |

Naming matrix for other Java stacks: [../../NAMING.md](../../NAMING.md).
