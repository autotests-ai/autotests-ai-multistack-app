# Test layers (canonical map)

Teaching pyramid for reference-app-copy. **One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).  
Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

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
                    │ unit │ active backend (product code)
                    └─────────────┘
```

`component` sits **beside** the Java ladder (frontend zone), not inside `tests/java/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

## Two knobs, no layer tasks

When `TESTS_LANG=java`, a layer is a **tag filter**, a stand is **`-Denv`**. There is one Gradle
task — `test`:

```bash
./gradlew test -Denv=reference_ci   -DincludeTags=test-infra
./gradlew test -Denv=reference_prod -DincludeTags=api
./gradlew test -Denv=reference_prod -DincludeTags=smoke -DexcludeTags=visual
```

| Stand (`-Denv`) | Where it points |
|-----------------|-----------------|
| `reference_ci` | the compose stack on this machine — UI `:9811`, API `:8800` (`docker compose up -d` first) |
| `reference_prod` | [reference-app-copy.autotests.ai/backend-java-spring](https://reference-app-copy.autotests.ai/backend-java-spring), browsers from the Selenoid hub |

Anything else — `headless`, `enableHar`, `enableVideo`, `updateBaselines`, `allureReportMode` — is a
per-run `-D<key>=<value>`. Available keys: `src/test/resources/config/default.properties`.

For `TESTS_LANG` ∈ `javascript` \| `typescript` \| `python`, CI runs the **full** active-module
suite (`npm test` / `pytest` with `UI_URL` / `BASE_URL`) — no Gradle tag slice yet.

## Layer table

| Layer | Zone | Where | Selector | Run |
|-------|------|-------|----------|-----|
| unit | backend | active `BACKEND_DIR` (default `backend/java/backend-java-spring/`) | all backend unit tests | by `BACKEND_LANG`: gradle+JaCoCo · `pytest` · `go test` · `npm test` — see [backend/README.md](../backend/README.md) |
| test-infra | tests | `…/tests/testinfra/` | `@Layer("test-infra")` + `@Tag("test-infra")` | by `TESTS_LANG`: java → `-DincludeTags=test-infra`; else full suite |
| component | frontend | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest | `npm test` |
| api | tests | `…/tests/api/` | `@Tag("api")` | by `TESTS_LANG`: java → `-DincludeTags=api`; else full suite |
| integration | tests | e.g. `LoginFormTests`, `LoginEmbedTests` | `@Tag("mount")` | by `TESTS_LANG`: java → `-DincludeTags=mount` via `integration-tests`; else N/A (use `e2e-tests`) |
| e2e | tests | `…/tests/`, `…/tests/e2e/` | `@Tag("smoke")` | by `TESTS_LANG`: java → `-DincludeTags=smoke -DexcludeTags=visual` via `e2e-tests`; else full suite |
| visual | tests | baselines | `@Tag("visual")` | by `TESTS_LANG`: java → `-DincludeTags=visual` via `visual-tests`; else N/A |
| manual | tests | stubs | `@Tag("manual")` | by `TESTS_LANG`: java → `-DincludeTags=manual` via `manual-tests`; else N/A |

Bare `./gradlew test` (java) runs **everything**, api included — there are no hidden excludes.

Active teaching module defaults: `tests/java/tests-java-gradle-junit5-allure3-selenide/` (`TESTS_LANG=java`).  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).

## Why `unit` and `test-infra`?

| Job | Product under test |
|-----|--------------------|
| `unit-tests` | **Application** (active backend — services, controllers, JWT; toolchain from `BACKEND_LANG`) |
| `test-infra-tests` | **Test tooling** (ConfigReader, HarCapture, CSS helpers when `TESTS_LANG=java`) — not a second pyramid tip for the app |

Students: one product unit layer (`unit-tests`); test-infra = harness checks that drive higher layers.

The 100% line-coverage gate (`jacocoTestCoverageVerification`) is java-only: it measures
`ConfigReader`, `LayoutCss` and `TokensCss`, and reads `build/jacoco/test.exec` — so it is
meaningful together with `-DincludeTags=test-infra` and nothing narrower.

## Why `component` and `integration`?

| | `component` | `integration` |
|---|-----------------|---------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | mounted product pages (header, forms) |
| Lesson | logic / props / a11y | real CSS / layout / embed |

Not duplicates — different failure modes. Chrome layout for the app is `integration`, not a DS catalog job.

## When each layer runs

| Trigger | Jobs |
|---------|------|
| Pull request (blocks merge) | `unit-tests`, `component-tests`, `test-infra-tests` |
| Push to `main` | the same three → `build` → `deploy` → `api-tests` on `reference_prod` |
| `workflow_dispatch` | `integration-tests` / `e2e-tests` / `visual-tests` / `manual-tests` behind `layers` (`none` \| `integration` \| `e2e` \| `visual` \| `manual` \| `all`) + `env`; `javascript-tests` / `python-tests` behind `runners` (`none` \| `javascript` \| `python` \| `both`) |

Active stack and prod URL are workflow `env` defaults in [`ci.yml`](../.github/workflows/ci.yml)
(`BACKEND`, `BACKEND_LANG`, `FRONTEND`, `TESTS`, `TESTS_LANG`) — change once, jobs reuse them.
Job ids are layers or languages, not tools (`e2e-tests`, not `selenide-tests`; `javascript-tests`,
not `playwright-tests`).

Nothing runs on a schedule. Browser layers have no PR job: a GitHub runner has no compose stack,
and against prod they belong to a deliberate dispatch run.

## Alt runners (side stacks)

| Module | Role |
|--------|------|
| `tests/javascript/tests-javascript-playwright/` | e2e smoke, another language (**active**) |
| `tests/python/tests-python-selenium/` | e2e smoke, pytest (**active**) |
| `tests/typescript/…`, `kotlin/…`, `go/…`, Cypress, … | slots in [`deploy/matrix.yaml`](../deploy/matrix.yaml) |

Same app under test; not separate pyramid layers — parallel teaching stacks ([NAMING.md](NAMING.md)).
They read env vars, not `-Denv`: Playwright takes `UI_URL`, pytest takes `BASE_URL`.

## Where the commands live

Every job in [`ci.yml`](../.github/workflows/ci.yml) is checkout, language setup (from `TESTS_LANG`
or `BACKEND_LANG`), one `./gradlew test …` / `npm test` / `pytest`. No composite actions, no
wrapper scripts — the command a student runs locally is the command CI runs.

Dispatch `layers=integration|e2e|visual|manual|all` for the named browser jobs. To add
another, copy `manual-tests` and change the java `-D` flags.
