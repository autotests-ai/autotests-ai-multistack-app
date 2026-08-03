# tests-java-gradle

Gradle · Selenide · JUnit 5 · Allure pyramid (api, e2e, component, visual).

**Not backend unit tests** — those live in `backend/java/backend-java-spring/src/test/java/`.

## Sibling runners (same app)

| Path | Stack |
|------|-------|
| [`../../javascript/tests-javascript-playwright/`](../../javascript/tests-javascript-playwright/) | Playwright |
| [`../../python/tests-python-selenium/`](../../python/tests-python-selenium/) | pytest · Selenium |

## Pyramid layers

| Layer | Where | Notes |
|-------|--------|--------|
| unit (backend) | `backend/java/backend-java-spring/src/test` | `./gradlew test` in backend module |
| unit (helpers) | `testUnit` in this module | config/helpers coverage |
| component | `@Tag("component")` | catalog: `frontend/javascript/frontend-javascript-preview/` on :3000 |
| api / integration | `testApi`, `testIntegration` | Rest Assured |
| e2e / visual | `testE2e`, `testVisual` | Selenide |

```bash
cd tests/java/tests-java-gradle
./gradlew testUnit -DpyramidStand=reference_ci
./gradlew testE2e -Denv=reference_ci_e2e -DallureReportMode=none
```

Env profiles: `src/test/resources/config/` · regenerate: `backend/scripts/gen-env-configs.py`

Block 2: wire into **one** CI workflow (deferred workflows in `.github/workflows/_deferred/`).
