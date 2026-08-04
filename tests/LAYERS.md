# Test layers (canonical map)

Teaching pyramid for reference-app-copy. **One** CI file: [`.github/workflows/test.yml`](../.github/workflows/test.yml).  
Jobs = layers; enable gradually (block 2a → 2f). Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  exploratory stubs
                    ├─────────────┤
                    │   visual    │  PNG baselines, Chrome
                    ├─────────────┤
                    │     e2e     │  user flows, app :8080 / prod
                    ├─────────────┤
                    │ integration │  mount / wiring on app page
                    ├─────────────┤
                    │component_br.│  DS catalog :3000 (Selenide)
                    ├─────────────┤
                    │component_rtl│  React in jsdom (Vitest) — sideways
                    ├─────────────┤
                    │     api     │  REST, no UI
                    ├─────────────┤
                    │  test-infra   │ tests/testinfra (@Layer test-infra, @Tag test-infra)
                    ├─────────────┤
                    │ unit_backend │ Spring, JaCoCo (product code)
                    └─────────────┘
```

`component_rtl` sits **beside** the Java ladder (frontend zone), not inside `tests/java/…`.

## Layer table

| Layer (job id) | Zone | Where | Selector | Run | Target URL |
|----------------|------|-------|----------|-----|------------|
| `unit_backend` | backend | `backend/java/backend-java-spring/src/test/` | all backend tests | `./gradlew test` (+ JaCoCo) | n/a |
| `test-infra` | tests | `…/tests/testinfra/` | `tests.testinfra.*` · `@Layer("test-infra")` + `@Tag("test-infra")` | `./gradlew testInfra` | n/a |
| `component_rtl` | frontend | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest | `npm test` | jsdom |
| `api` | tests | `…/tests/api/` | `@Tag("api")` | `./gradlew testApi` | app `:8080` |
| `integration` | tests | e.g. `LoginFormTests`, `LoginEmbedTests` | `@Tag("layout")` / `@Tag("mount")` | `./gradlew testIntegration` | app `:8080` |
| `component_browser` | tests | `…/tests/component/` | `@Tag("component")` | `./gradlew testComponent` | catalog `:3000` |
| `e2e` | tests | `…/tests/`, `…/tests/e2e/` | `@Tag("smoke")` | `./gradlew testE2e` | app `:8080` (CI) / prod (post-deploy) |
| `visual` | tests | baselines | `@Tag("visual")` | `./gradlew testVisual` | app / catalog |
| `manual` | tests | stubs | `@Tag("manual")` | `./gradlew testManual` | n/a |
| `prod_api` | tests | same api | after successful Deploy (`workflow_run`) | `testApi` + `reference_prod` | [reference-app-copy.autotests.ai/backend-java-spring](https://reference-app-copy.autotests.ai/backend-java-spring) |
| `prod_e2e` | tests | same e2e | deferred | `testE2e` + `reference_prod_*` | prod + Selenoid |

Active Java module: `tests/java/tests-java-gradle-junit5-allure3-selenide/`  
Gradle slices SSOT: `build.gradle` → `layerTestSlices`.  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).

## Why `unit_backend` and `test-infra`?

| Job | Product under test |
|-----|--------------------|
| `unit_backend` | **Application** (Spring services, controllers, JWT) |
| `test-infra` | **Test tooling** (ConfigReader, HarCapture, CSS helpers) — not a second pyramid tip for the app |

Students: one product unit layer (`unit_backend`); `test-infra` = harness checks that drive higher layers.

## Why `component_rtl` and `component_browser`?

| | `component_rtl` | `component_browser` |
|---|-----------------|---------------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | DS catalog primitives |
| Lesson | logic / props / a11y | real CSS / layout / embed |

Not duplicates — different failure modes.

## Enable order (block 2)

| Phase | Jobs on |
|-------|---------|
| 2a | `unit_backend`, `test-infra`, `component_rtl` |
| 2b | + `api` (+ compose) |
| 2c | + `integration` |
| 2d | + `component_browser` (+ preview `:3000`) |
| 2e | + `e2e` |
| 2f | + `prod_api`, `prod_e2e` after successful Deploy |
| 3+ | `visual`, `manual`, Playwright / pytest runners |

## Alt runners (side stacks)

| Module | Role |
|--------|------|
| `tests/javascript/tests-javascript-playwright/` | e2e smoke, another language |
| `tests/python/tests-python-selenium/` | e2e smoke, pytest |

Same app under test; not separate pyramid layers — parallel teaching stacks ([NAMING.md](NAMING.md)).
