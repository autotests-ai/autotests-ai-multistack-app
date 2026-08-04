# Test layers (canonical map)

Teaching pyramid for reference-app-copy. **One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).  
Jobs = layers; enable gradually (block 2a → 2f). Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  exploratory stubs
                    ├─────────────┤
                    │   visual    │  PNG baselines, Chrome
                    ├─────────────┤
                    │     e2e     │  user flows, UI :9811 + api :8800 / prod
                    ├─────────────┤
                    │ integration │  mount / wiring on SPA (header, login form)
                    ├─────────────┤
                    │component│  React in jsdom (Vitest) — sideways
                    ├─────────────┤
                    │     api     │  REST, no UI
                    ├─────────────┤
                    │  test-infra   │ tests/testinfra (@Layer test-infra, @Tag test-infra)
                    ├─────────────┤
                    │ unit │ Spring, JaCoCo (product code)
                    └─────────────┘
```

`component` sits **beside** the Java ladder (frontend zone), not inside `tests/java/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

## Layer table

| Layer (job id) | Zone | Where | Selector | Run | Target URL |
|----------------|------|-------|----------|-----|------------|
| `unit` | backend | `backend/java/backend-java-spring/src/test/` | all backend tests | `./gradlew test` (+ JaCoCo) | n/a |
| `test-infra` | tests | `…/tests/testinfra/` | `tests.testinfra.*` · `@Layer("test-infra")` + `@Tag("test-infra")` | `./gradlew testInfra` | n/a |
| `component` | frontend | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest | `npm test` | jsdom |
| `api` | tests | `…/tests/api/` | `@Tag("api")` | `./gradlew testApi` | API `:8800` |
| `integration` | tests | e.g. `LoginFormTests`, `LoginEmbedTests` | `@Tag("layout")` / `@Tag("mount")` | `./gradlew testIntegration` | UI `:9811` |
| `e2e` | tests | `…/tests/`, `…/tests/e2e/` | `@Tag("smoke")` | `./gradlew testE2e` | UI `:9811` + API `:8800` (CI) / prod (post-deploy) |
| `visual` | tests | baselines | `@Tag("visual")` | `./gradlew testVisual` | app SPA |
| `manual` | tests | stubs | `@Tag("manual")` | `./gradlew testManual` | n/a |
| `prod-api` | tests | same api | `ci.yml` job after `deploy` | `testApi` + `reference_prod` | [reference-app-copy.autotests.ai/backend-java-spring](https://reference-app-copy.autotests.ai/backend-java-spring) |
| `prod-e2e` | tests | same e2e | deferred | `testE2e` + `reference_prod_*` | prod + Selenoid |

Active Java module: `tests/java/tests-java-gradle-junit5-allure3-selenide/`  
Gradle profiles SSOT: `build.gradle` → `layerTestProfiles`.  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).

## Why `unit` and `test-infra`?

| Job | Product under test |
|-----|--------------------|
| `unit` | **Application** (Spring services, controllers, JWT) |
| `test-infra` | **Test tooling** (ConfigReader, HarCapture, CSS helpers) — not a second pyramid tip for the app |

Students: one product unit layer (`unit`); `test-infra` = harness checks that drive higher layers.

## Why `component` and `integration`?

| | `component` | `integration` |
|---|-----------------|---------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | mounted product pages (header, forms) |
| Lesson | logic / props / a11y | real CSS / layout / embed |

Not duplicates — different failure modes. Chrome layout for the app is `integration`, not a DS catalog job.

## Enable order (block 2)

| Phase | Jobs on |
|-------|---------|
| 2a | `unit`, `test-infra`, `component` ← **on in CI** |
| 2b | + `api` (+ compose) |
| 2c | + `integration` |
| 2d | + `e2e` |
| 2e | + `prod-api`, `prod-e2e` after successful Deploy |
| 3+ | `visual`, `manual`, Playwright / pytest runners |

## Alt runners (side stacks)

| Module | Role |
|--------|------|
| `tests/javascript/tests-javascript-playwright/` | e2e smoke, another language (**active**) |
| `tests/python/tests-python-selenium/` | e2e smoke, pytest (**active**) |
| `tests/typescript/…`, `kotlin/…`, `go/…`, Cypress, … | slots in [`deploy/matrix.yaml`](../deploy/matrix.yaml) |

Same app under test; not separate pyramid layers — parallel teaching stacks ([NAMING.md](NAMING.md)). Enable with LAYERS block 3+.

## Where the commands live

Every layer is a job in [`ci.yml`](../.github/workflows/ci.yml): checkout, language setup, one `./gradlew <task>` or `npm test`. No composite actions, no wrapper scripts — the command a student runs locally is the command CI runs.

To turn a layer on, add a job with its task from the table above.
