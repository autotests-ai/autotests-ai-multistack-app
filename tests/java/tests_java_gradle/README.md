# tests_java_gradle

Gradle · Selenide · JUnit 5 · Allure — api, e2e, browser component, visual.

**Not backend unit tests** — those live in `backend/java/backend_java_spring/src/test/java/`.  
**Not RTL** — Vitest/RTL lives in `frontend/typescript/frontend_typescript_react-testing-library/`.

## Sibling runners

| Path | Stack |
|------|-------|
| [`../../javascript/tests_javascript_playwright/`](../../javascript/tests_javascript_playwright/) | Playwright |
| [`../../python/tests_python_selenium/`](../../python/tests_python_selenium/) | pytest · Selenium |

## Layers

| Layer | Where | Notes |
|-------|--------|--------|
| unit (backend) | `backend/java/backend_java_spring/src/test` | `./gradlew test` in backend module |
| unit (helpers) | `testUnit` in this module | config/helpers coverage |
| component (browser) | `@Tag("component")` | catalog: `frontend/javascript/frontend_javascript_preview/` on :3000 |
| api / integration | `testApi`, `testIntegration` | Rest Assured |
| e2e / visual | `testE2e`, `testVisual` | Selenide |

```bash
cd tests/java/tests_java_gradle
./gradlew testUnit -DpyramidStand=reference_ci
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
```

Block 2: wire into **one** `test.yml` (deferred workflows in `.github/workflows/_deferred/`).
