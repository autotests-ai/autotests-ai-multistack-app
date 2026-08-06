# Test layers (canonical map)

Teaching pyramid for reference-app-copy — **classical** names (ISTQB-style):
unit → integration (no UI) → e2e → manual.
**One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(pyramid + Allure 3 / TestOps / Notifications + JaCoCo + Sonar quality axis).  
Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  exploratory stubs
                    ├─────────────┤
                    │     e2e     │  UI through browser (@Tag e2e; optional visual / smoke)
                    ├─────────────┤
                    │ integration │  wired system, no UI (HTTP API ↔ backend/DB)
                    ├─────────────┤
                    │component│  React in jsdom (Vitest) — sideways FE, not classical tip
                    ├─────────────┤
                    │ unit │ active backend (product code)
                    └─────────────┘
```

`component` sits **beside** the Java ladder (frontend zone), not inside `tests/java/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

**Not classical:** calling Chrome “mount” checks `integration`. Those are thin **e2e** (`@Tag("smoke")`).

## Harness (not a pyramid layer)

Self-check of the **tests module helpers** before / alongside product layers — job `tests-harness`, tag `@Tag("harness")`:

- `tests/testinfra/` — `ConfigReader`, `HarCapture`, CSS helpers
- `./gradlew test -DincludeTags=harness` (+ JaCoCo 100% gate on harness classes)
- **Not** application code (that's `unit-tests` on `BACKEND_DIR`)

## Smoke and visual (inside e2e, not layers)

| Slice | Tag | CI |
|-------|-----|-----|
| Thin UI after FE deploy | `@Tag("smoke")` (+ `@Tag("e2e")`) | job `e2e-smoke` on push to `main` |
| Flow (default `layers=e2e`) | `@Tag("e2e")` exclude visual | job `e2e-tests` |
| Flow + visual (`layers=all`) | `e2e,visual` | job `e2e-tests` |
| Refresh baselines | `@Tag("visual")` + `-DupdateBaselines=true` | job `e2e-update-baselines` |

Local refresh: `./gradlew test -Denv=reference_ci -DincludeTags=visual -DupdateBaselines=true`

Mocked-backend smoke (FE lane without live API) — follow-up; current smoke hits deployed UI.

## Two knobs, no layer tasks

When `TESTS_LANG=java`, a layer is a **tag filter**, a stand is **`-Denv`**. There is one Gradle
task — `test`:

```bash
./gradlew test -Denv=reference_ci   -DincludeTags=harness
./gradlew test -Denv=reference_prod -DincludeTags=integration
./gradlew test -Denv=reference_prod -DincludeTags=smoke
./gradlew test -Denv=reference_prod -DincludeTags=e2e -DexcludeTags=visual
./gradlew test -Denv=reference_prod -DincludeTags=e2e,visual
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
| component | frontend | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest | `npm test` |
| integration | tests | `…/tests/integration/` | `@Tag("integration")` | java → `-DincludeTags=integration` via `integration-tests` (after `deploy-backend`); else full suite |
| e2e | tests | `…/tests/e2e/` | `@Tag("e2e")` (+ optional `smoke` / `visual`) | `e2e-smoke` (push, `smoke`); `e2e-tests` (dispatch) |
| manual | tests | stubs | `@Tag("manual")` | java → `-DincludeTags=manual` via `manual-tests`; else N/A |

Bare `./gradlew test` (java) runs **everything**, integration included — there are no hidden excludes.

Active teaching module defaults: `tests/java/tests-java-gradle-junit5-allure3-selenide/` (`TESTS_LANG=java`).  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).

## Why `unit` and `harness`?

| Job | Product under test |
|-----|--------------------|
| `unit-tests` | **Application** (active backend — services, controllers, JWT; toolchain from `BACKEND_LANG`) |
| `tests-harness` | **Test tooling** (ConfigReader, HarCapture, CSS helpers when `TESTS_LANG=java`) — pre-flight, not a pyramid tip |

Students: one product unit layer (`unit-tests`); harness = helper checks that higher layers depend on.

The 100% line-coverage gate (`jacocoTestCoverageVerification`) is java-only: it measures
`ConfigReader`, `LayoutCss` and `TokensCss`, and reads `build/jacoco/test.exec` — so it is
meaningful together with `-DincludeTags=harness` and nothing narrower.

## Why `component` vs `e2e` (not vs integration)?

| | `component` | `e2e` (incl. smoke) |
|---|-----------------|---------------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | product pages in a browser |
| Lesson | logic / props / a11y | real CSS / layout / flows |

Integration is **HTTP / wired backend**, no browser. Chrome checks belong under e2e.

## When each layer runs

| Trigger | Jobs |
|---------|------|
| Pull request (blocks merge) | `unit-tests`, `component-tests`, `tests-harness` |
| Push to `main` | same three → two CD lanes: `build-backend` → `deploy-backend` → `integration-tests`; `build-frontend` → `deploy-frontend` → `e2e-smoke` |
| `workflow_dispatch` | `integration-tests` / `e2e-tests` / `manual-tests` behind `layers`; tag overrides on e2e; `e2e-update-baselines` behind `update_baselines=true`; `env` |

Active stack and prod URL are workflow `env` defaults in [`ci.yml`](../.github/workflows/ci.yml)
(`BACKEND`, `BACKEND_LANG`, `FRONTEND`, `TESTS`, `TESTS_LANG`) — change once, jobs reuse them.
Job ids are layers or languages, not tools (`e2e-tests`, not `selenide-tests`; `javascript-tests`,
not `playwright-tests`).

Deploy jobs share concurrency group `deploy-reference-app-copy` (one checkout dir on the host).
Frontend deploy does **not** wait on backend success.

Nothing runs on a schedule. Full e2e has no PR job: a GitHub runner has no compose stack,
and against prod it belongs to a deliberate dispatch run (smoke is the automatic UI gate).

## Alt runners (side stacks)

| Module | Role |
|--------|------|
| `tests/javascript/tests-javascript-playwright/` | e2e, another language (**active**) |
| `tests/python/tests-python-selenium/` | e2e, pytest (**active**) |
| `tests/typescript/…`, `kotlin/…`, `go/…`, Cypress, … | slots in [`deploy/matrix.yaml`](../deploy/matrix.yaml) |

Same app under test; not separate pyramid layers — parallel teaching stacks ([NAMING.md](NAMING.md)).
They read env vars, not `-Denv`: Playwright takes `UI_URL`, pytest takes `BASE_URL`.

## Where the commands live

Every job in [`ci.yml`](../.github/workflows/ci.yml) is checkout, language setup (from `TESTS_LANG`
or `BACKEND_LANG`), one `./gradlew test …` / `npm test` / `pytest`. No composite actions, no
wrapper scripts — the command a student runs locally is the command CI runs.

Dispatch `layers=integration|e2e|manual|all`. To add another, copy `manual-tests` and change
the java `-D` flags.
