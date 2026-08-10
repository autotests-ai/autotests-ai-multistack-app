# Test layers (canonical map)

Teaching pyramid for reference-app-copy — **classical** names (ISTQB-style):
unit → integration (wired, no UI) → api → e2e → manual.
**One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(pyramid + Allure 3 / TestOps / Notifications + JaCoCo + Sonar quality axis).  
Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  in code — exploratory stubs (@Manual + steps)
                    ├─────────────┤
                    │     e2e     │  UI through browser (@Tag e2e; optional visual / mock)
                    ├─────────────┤
                    │     api     │  HTTP contract (@Tag api — any client / language)
                    ├─────────────┤
                    │ integration │  deploy wiring facts, no UI (@Tag integration)
                    ├─────────────┤
                    │component│  React in jsdom (Vitest) — sideways FE, not classical tip
                    ├─────────────┤
                    │ unit │ active backend (product code; incl. Spring slices)
                    └─────────────┘
```

`component` sits **beside** the tests ladder (frontend zone), not inside `tests/<lang>/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

**Not classical:** calling Chrome “mount” checks `integration`. Those are thin **e2e** (`@Tag("mock")`).  
**Not classical either:** Spring `@WebMvcTest` / `@DataJpaTest` — those stay in **unit** (see slices below).

## integration vs api — intent, not tag

Same HTTP calls, same stand — different question. Client is whatever the active tests
module uses (Java today: Rest Assured; Playwright/pytest helpers when those stacks grow
an `api` slice). **api** asserts the HTTP contract: status codes, JSON Schemas
(`src/test/resources/schemas/`), error envelopes — values that hold on *any* healthy
deployment of the shared JSON API (any `BACKEND_LANG`). **integration** asserts wiring
facts of *this* deployment: which module answered (`service` id), where data physically
lives (`source=postgresql`), whether the Flyway seed arrived, whether DB + JWT hold
across separate requests. No assertion appears in both layers:

| Question | Layer | Example |
|----------|-------|---------|
| Is `{token, username, redirectUrl}` the login response shape? | api | `AuthApiTests` + `schemas/auth-response.json` |
| Did the deploy wire PostgreSQL, not a stub? | integration | `BackendWiringIntegrationTests` (`source=postgresql`) |
| Does a duplicate username answer 409? | api | `AuthApiTests.registerDuplicateUsername` |
| Is seed user1 present after deploy? | integration | `SeedDataIntegrationTests` |
| Do DB and JWT survive separate HTTP requests? | integration | `AuthRoundTripIntegrationTests` (full lifecycle: register → login → me → logout still 200 → `DELETE /me` → me is 401) |

## Manual lives in code (canon)

Manual / exploratory cases are **first-class sources in the test module**, not spreadsheets
or TestOps-only drafts outside git:

- Package: `…/tests/manual/` (e.g. `ExploratoryManualTests`)
- Markers: `@Layer("manual")` · `@Tag("manual")` · `@Manual` (`ALLURE_MANUAL=true` for TestOps)
- Body: Allure `step("…")` checklist lines — human executes; CI can still upload the stub launch
- Run: `./gradlew test -Denv=reference_prod -DincludeTags=manual` · job `manual-tests` (dispatch)

Same repo, same review/PR flow as automated layers. Promote a stub to e2e by replacing steps
with real Selenide/API calls and retagging — do not keep a parallel wiki checklist.

## Harness (not a pyramid layer)

Self-check of the **tests module helpers** before / alongside product layers — umbrella `@Tag("harness")`, split by lane:

| Slice | Tags | CI job | Gates |
|-------|------|--------|-------|
| backend | `harness` + `harness-backend` | `tests-harness-backend` | every PR + push (no deploy needed); feeds `sonar-tests` |
| frontend | `harness` + `harness-frontend` | `tests-harness-frontend` | every PR + push (no deploy needed); feeds `sonar-tests` |
| umbrella | `harness` | `sonar-tests` | after **both** harness jobs (PR + main); umbrella helpers + tests-module Sonar gate |

```bash
./gradlew test -Denv=reference_ci -DincludeTags=harness-backend   # + JaCoCo on ConfigReader
./gradlew test -Denv=reference_ci -DincludeTags=harness-frontend  # + JaCoCo on CSS helpers
./gradlew test -Denv=reference_ci -DincludeTags=harness           # full harness
```

**Not** application code (that's `unit-tests` on `BACKEND_DIR` / `component-tests` on `FRONTEND_DIR`).

## Mock and visual (inside e2e, not layers)

| Slice | Tag | CI |
|-------|-----|-----|
| UI on stub API (mount + error injection) | `@Tag("mock")` (+ `@Tag("e2e")`) | job `e2e-mock-tests` on every PR; on push to `main` when frontend changed |
| Flow | `@Tag("e2e")` exclude visual | job `e2e-tests` (after `integration-tests` + `api-tests`) |
| Flow + visual (dispatch `run_visual`) | `e2e,visual` | job `e2e-tests` |
| Refresh baselines | `@Tag("visual")` + `-DupdateBaselines=true` | job `e2e-update-baselines` (dispatch `update_baselines`) |

Local refresh: `./gradlew test -Denv=reference_ci -DincludeTags=visual -DupdateBaselines=true`

**Mock stand** — browser checks that need controlled `/api/*` JSON, not a live backend.
Stand = `-Denv=reference_mock`; slice = `-DincludeTags=mock`.

The SPA is served at document root and resolves API to `/api`; the frontend container nginx
has no `/api` route, so a **stand-gateway** (compose profile `mock`, port **9911**) proxies
`/` → frontend and `/api/` → WireMock stubs in `deploy/mock/mappings/`. Default stubs answer
the same shapes as the real controllers (incl. `401` on `/api/auth/me` without a bearer).
The gateway also proxies WireMock admin at `/__admin/` for scenario switches.

Two `@Tag("mock")` flavours in the same job:

| Flavour | What | Classes / mechanism |
|---------|------|---------------------|
| Mount (happy stubs) | layout / form chrome with a healthy stub API | `HomeLayoutTests`, `LoginFormTests`, `LoginEmbedTests`, `RegisterFormTests` |
| Error injection | UI error panels a live backend can never produce | `HomeErrorStateTests` — `MockScenarios` flips WireMock scenarios `items` / `health` to state `error` → mappings `items-error.json` / `health-error.json` answer `500` |

On stands without `/__admin/` (ci/prod) the error-injection tests **skip by JUnit assumption**
instead of failing — same suite, honest report. Happy-mount tests need only the stub
mappings; they do not call admin.

```bash
docker compose --profile mock up -d stand-gateway   # :9911 + api-mock + react frontend
./gradlew test -Denv=reference_mock -DincludeTags=mock
```

Stand registry id: `mock-gateway` (`python scripts/stands/ensure.py mock-gateway` from monorepo root).

The CI job needs no deploy, no prod URL and no Selenoid hub: it brings the profile up on the
runner, runs the slice, then tears it down.

## Two knobs, no layer tasks

When `TESTS_LANG=java`, a layer is a **tag filter**, a stand is **`-Denv`**. There is one Gradle
task — `test`:

```bash
./gradlew test -Denv=reference_ci   -DincludeTags=harness-backend
./gradlew test -Denv=reference_ci   -DincludeTags=harness-frontend
./gradlew test -Denv=reference_ci   -DincludeTags=harness
./gradlew test -Denv=reference_mock -DincludeTags=mock
./gradlew test -Denv=reference_prod -DincludeTags=integration
./gradlew test -Denv=reference_prod -DincludeTags=api
./gradlew test -Denv=reference_prod -DincludeTags=e2e -DexcludeTags=visual
./gradlew test -Denv=reference_prod -DincludeTags=e2e,visual
```

| Stand (`-Denv`) | Where it points |
|-----------------|-----------------|
| `reference_ci` | the compose stack on this machine — UI + real `/api` same origin via `stand-gateway-ci` `:9821`, direct API `:8800` (`docker compose up -d` first) |
| `reference_mock` | mock profile — UI + stub API same origin `:9911` (`docker compose --profile mock up -d stand-gateway` first) |
| `reference_prod` | [reference-app-copy.autotests.ai/backend-java-spring](https://reference-app-copy.autotests.ai/backend-java-spring), browsers from the Selenoid hub |

Anything else — `headless`, `enableHar`, `enableVideo`, `updateBaselines`, `allureReportMode` — is a
per-run `-D<key>=<value>`. Available keys: `src/test/resources/config/default.properties`.

For `TESTS_LANG` ∈ `javascript` \| `typescript` \| `python`, CI runs the **full** active-module
suite (`npm test` / `pytest` with `UI_URL` / `BASE_URL`) — no Gradle tag slice yet.

## Layer table

| Layer | Zone | Where | Selector | Run |
|-------|------|-------|----------|-----|
| unit | backend | active `BACKEND_DIR` (default `backend/java/backend-java-spring/`) | all backend unit tests (plain + Spring slices) | by `BACKEND_LANG`: gradle+JaCoCo · `pytest` · `go test` · `npm test` — see [backend/README.md](../backend/README.md) |
| component | frontend | active `FRONTEND_DIR` only (default `frontend/typescript/frontend-typescript-react/`) — siblings not CI-gated | Vitest + coverage | `npm test -- --coverage` via `component-tests` |
| integration | tests | `…/tests/integration/` (`BackendWiringIntegrationTests`, `AuthRoundTripIntegrationTests`, `SeedDataIntegrationTests`) | `@Tag("integration")` | java → `-DincludeTags=integration` via `integration-tests` (after `stand-ready`) |
| api | tests | `…/tests/api/` (`AuthApiTests`, `ReferenceApiTests`) — HTTP contract of the shared JSON API | `@Tag("api")` (java today; other `TESTS_LANG` can grow the same slice) | java → `-DincludeTags=api` via `api-tests` (**parallel** to `integration-tests`, both after `stand-ready`); retarget any backend with `-DapiBaseUrl` / `-DapiHealthService` |
| e2e | tests | `…/tests/e2e/` | `@Tag("e2e")` (+ optional `visual` / `mock`) | `e2e-mock-tests` (push, `mock`); `e2e-tests` (after lanes + `sonar-tests` join) |
| manual | tests | `…/tests/manual/` **in code** | `@Tag("manual")` + `@Manual` | java → `-DincludeTags=manual` via `manual-tests` (after `e2e-tests`, dispatch) |

### Frontend reference modules (not interchangeable)

| Role | Module | Why |
|------|--------|-----|
| UX / product code (no Vitest) | `frontend-javascript-vanilla` | Teaching SPA without a framework runner — Session markup, auth wiring, copy |
| Vitest / component + deploy | `frontend-typescript-react` | CI `FRONTEND` default (`:9811`); `component-tests` / sonar / build / deploy follow this knob |

`frontend-javascript-react` is the JS twin — keep contract parity locally; CI does **not** matrix sibling frontends. Flip `FRONTEND` / `FRONTEND_DIR` together when the teaching default changes.  
Do **not** add Vitest to vanilla; do **not** set `FRONTEND` to vanilla (no npm runner).

Bare `./gradlew test` (java) runs **everything**, integration included — there are no hidden excludes.

Active teaching module defaults: `tests/java/tests-java-gradle-junit5-allure3-selenide/` (`TESTS_LANG=java`).  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).

## Why `unit` and `harness`? (and why Spring “slices” ≠ integration)

| Job | Product under test |
|-----|--------------------|
| `unit-tests` | **Application** (active backend — toolchain from `BACKEND_LANG`) |
| `tests-harness-backend` | **Test tooling (BE lane)** — `ConfigReader` |
| `tests-harness-frontend` | **Test tooling (FE lane)** — CSS helpers, HAR helpers |
| `component-tests` | **Application** (active `FRONTEND_DIR` only — Vitest + coverage → `sonar-frontend` / `build-frontend`) |

Students: product unit layers (`unit-tests` / `component-tests`); harness = helper checks that higher layers depend on.

**Slices (java Spring, inside `unit-tests` — not the classical integration layer).**  
After the integration/api split, “slice” means a *partial Spring context* in the backend
module, still `layer=unit` / job `unit-tests`. Allure `suite=slice` (`SliceTestBase`)
separates them from one-class-in-isolation units in the report — the teaching pyramid
stays six classical layers; we do **not** promote these to `@Tag("integration")`.

| Slice | Spring test | What it proves | Docker? |
|-------|-------------|----------------|---------|
| Web MVC | `@WebMvcTest` (+ `SecurityChainTest` with a real `JwtService`) | controller / security chain in isolation | no |
| Persistence | `@DataJpaTest` + Testcontainers (`PostgresSliceTestBase`, `postgres:16-alpine`) | Flyway + entities against the same Postgres the app ships with | yes |

Classical **integration** (`tests/…/integration/`, job `integration-tests`) is the other
question: the *deployed* stand’s wiring over HTTP. Do not rename Spring slices to
`integration` and do not move deploy wiring checks into `unit-tests`.

The 100% line-coverage gate (`jacocoTestCoverageVerification`) is java-only and slices by
`-DincludeTags` (`harness-backend` → `ConfigReader`; `harness-frontend` → `LayoutCss`/`TokensCss`;
`harness` → all three). It reads `build/jacoco/test.exec`.

## Why `component` vs `e2e` (not vs integration)?

| | `component` | `e2e` (incl. mock) |
|---|-----------------|---------------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | product pages in a browser |
| Lesson | logic / props / a11y | real CSS / layout / flows |

Integration is **HTTP / wired backend**, no browser. Chrome checks belong under e2e.

## When each layer runs

| Trigger | Jobs |
|---------|------|
| Pull request (blocks merge) | `unit-tests`, `component-tests`, `tests-harness-backend`, `tests-harness-frontend`, `e2e-mock-tests`, `sonar-backend`, `sonar-tests`, `sonar-frontend` |
| Push to `main` | the PR set (`e2e-mock-tests` only when frontend changed) + build/deploy lanes → `stand-ready` → `integration-tests` **∥** `api-tests` → `e2e-tests` (visual excluded) → `manual-tests` (skip unless dispatch) |
| `workflow_dispatch` | per-layer booleans `run_integration` / `run_api` / `run_mock` / `run_e2e` / `run_visual` / `run_manual`; `update_baselines=true` → `e2e-update-baselines`; `include_tags` / `exclude_tags` overrides on e2e; `deploy=none\|backend\|frontend\|both`; TestOps service inputs `ALLURE_JOB_RUN_ID` / `ALLURE_USERNAME` (leave blank unless TestOps UI triggers) |

Active stack and prod URL are workflow `env` defaults in [`ci.yml`](../.github/workflows/ci.yml)
(`BACKEND`, `BACKEND_LANG`, `FRONTEND`, `TESTS`, `TESTS_LANG`) — change once, jobs reuse them.
Job ids are layers or languages, not tools (`e2e-tests`, not `selenide-tests`; `javascript-tests`,
not `playwright-tests`).

Deploy jobs share concurrency group `deploy-reference-app-copy` (one checkout dir on the host).
Frontend deploy does **not** wait on backend success.

Nothing runs on a schedule. Full e2e has no PR job: a GitHub runner has no compose stack,
and against prod it belongs to a deliberate dispatch run (`e2e-mock-tests` is the automatic UI gate).

## TestOps (live upload + selective rerun)

`testops-context` opens one shared launch/job-run; layer jobs stream via
[`.github/scripts/run-with-allurectl.sh`](../.github/scripts/run-with-allurectl.sh)
(`allurectl watch --job-run-child`). Missing `ALLURE_TOKEN` / `ALLURE_PROJECT_ID` disables
live upload without failing tests — raw `allure-results` still publish.

| Mode | Selection | `ALLURE_KEEP_TESTPLAN` |
|------|-----------|------------------------|
| PR / push / ordinary dispatch | CI layer filters (`-DincludeTags` / npm scripts) | `false` — any TestOps testplan is stripped |
| TestOps UI rerun (`workflow_dispatch` + non-empty `ALLURE_JOB_RUN_ID`) | selective plan from TestOps | `true` — plan kept |

Launch env axes → `allure-results/environment.properties` (TestOps **Окружение** /
Report environment). Written by [`.github/scripts/write-allure-environment.sh`](../.github/scripts/write-allure-environment.sh)
from workflow `env` (before/after each test job + once after merge in `publish-allure-report`):

| Env | Value |
|-----|-------|
| `BROWSER` | `Chrome` |
| `OS` | `Linux` |
| `ENDPOINT` | `reference_prod` |
| `VERSION` | `github.sha` of the run |
| `BRANCH` | `github.head_ref` or `github.ref_name` |

Look under the test/launch **Окружение** block (not Custom fields — those are Epic/Feature/Suite from code).

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

Dispatch is per-layer booleans (`run_integration`, `run_api`, `run_mock`, `run_e2e`,
`run_visual`, `run_manual`) plus `update_baselines` and `include_tags`/`exclude_tags` overrides.
To add another layer, copy `manual-tests` and change the java `-D` flags.

## Test data and secrets

- Register-flow tests (api / e2e / integration) create `user_*` accounts and **delete them**
  through `DELETE /api/auth/me` (`AuthApiClient.deleteAccountQuietly`) — the prod stand does
  not accumulate test users. The lifecycle round-trip also documents stateless logout: the JWT
  survives `logout` and dies with the account.
- `reference_prod.properties` commits the **creds-less** hub URL. CI passes the real one via
  the `SELENOID_REMOTE_URL` secret (`-DremoteUrl=…` in `e2e-tests` / `e2e-update-baselines`);
  locally export it the same way when you need the shared hub.

## CD graph

```
every run (PR + main):
  unit-tests → sonar-backend            component-tests → sonar-frontend
  tests-harness-backend ─┐
  tests-harness-frontend ┴→ sonar-tests          e2e-mock-tests (every PR; main when FE changed)

main only:
  build-backend + sonar-backend → deploy-backend ──────────────┐
  build-frontend + sonar-frontend + e2e-mock → deploy-frontend ┴→ stand-ready
  stand-ready → integration-tests ∥ api-tests → e2e-tests → manual-tests (dispatch-only)
```

`integration-tests` and `api-tests` are **parallel** — both gate on `stand-ready`, neither on
the other: wiring facts and HTTP contract are independent questions about the same deploy.
`sonar-tests` scans **testinfra helpers** (`-DincludeTags=harness`), not api/e2e results.
It runs after both harness slices — on **PR** and **main**.
