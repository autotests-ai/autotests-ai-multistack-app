# Test layers (canonical map)

Teaching pyramid for autotests-ai-multistack-app — **classical** names (ISTQB-style):
unit → integration (wired, no UI) → api → e2e → manual.
**One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(pyramid + Allure 3 / TestOps / Notifications + JaCoCo + Sonar quality axis).  
Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  in code — exploratory stubs (@Manual + steps)
                    ├─────────────┤
                    │     e2e     │  UI through browser (@Tag e2e; optional screenshot / mock)
                    ├─────────────┤     component — jsdom job (Vitest), not a pyramid layer
                    │     api     │  HTTP contract (@Tag api — any client / language)
                    ├─────────────┤
                    │ integration │  Spring app + real PG, no deploy (@Tag integration)
                    ├─────────────┤
                    │    unit     │  backend product; CI `-DexcludeTags=integration`
                    └─────────────┘
```

Five classical layers: unit → integration → api → e2e → manual.  
`component` sits **beside** the ladder (frontend jsdom job), not between unit and integration, not inside `tests/<lang>/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

**Not classical:** calling Chrome “mount” checks `integration`. Those are thin **e2e** (`@Tag("mock")`).  
**Not classical either:** Spring `@WebMvcTest` / `@DataJpaTest` — those stay in **unit** (see slices below).

## integration vs api — intent, not tag

**integration** = full Spring Boot context against real PostgreSQL (Testcontainers) in the
**backend module**, before build/deploy. Proves the application wires Controller → Service →
Repository → Postgres and Flyway seed — not HTTP against a live stand.

**api** = HTTP contract and deployed-stand facts through Rest Assured (or equivalent) **after**
`deploy-backend`. Same endpoints, different question:

| Question | Layer | Example |
|----------|-------|---------|
| Is `{token, username, redirectUrl}` the login response shape? | api | `AuthApiTests` + `schemas/auth-response.json` |
| Does Flyway seed reach PostgreSQL inside the running app? | integration | `ApplicationWiringIntegrationTest` (`source=postgresql`, seed items) |
| Does a duplicate username answer 409? | api | `AuthApiTests.registerDuplicateUsername` |
| Do DB and JWT survive separate requests in-process? | integration | `AuthLifecycleIntegrationTest` |
| Did the deploy wire PostgreSQL, not a stub? | api | `BackendWiringApiTests` (`source=postgresql`) |
| Are seed items Alpha/Beta/Gamma visible on the stand? | api | `SeedDataApiTests` |
| Do DB and JWT survive separate HTTP requests on the live stand? | api | `AuthRoundTripApiTests` |

## Manual lives in code (canon)

Manual / exploratory cases are **first-class sources in the test module**, not spreadsheets
or TestOps-only drafts outside git:

- Package: `…/tests/manual/` (e.g. `ExploratoryManualTests`)
- Markers: `@Layer("manual")` · `@Tag("manual")` · `@Manual` (`ALLURE_MANUAL=true` for TestOps)
- Body: Allure `step("…")` checklist lines — human executes; CI can still upload the stub launch
- Run: `./gradlew test -Denv=multistack_prod -DincludeTags=manual` · job `manual-tests` (dispatch)

Same repo, same review/PR flow as automated layers. Promote a stub to e2e by replacing steps
with real Selenide/API calls and retagging — do not keep a parallel wiki checklist.

## Harness (not a pyramid layer)

Self-check of the **tests module helpers** before / alongside product layers — umbrella `@Tag("harness")`, one CI job:

| Slice | Tags | CI | Gates |
|-------|------|----|-------|
| all | `harness` | `tests-harness` | PR · frontend · tests · mixed/`all`; feeds `sonar-tests` |
| backend-only | `harness-backend` | same job | backend lane — `ConfigReader` only; **skips** `sonar-tests` |
| frontend helpers | `harness` + `harness-frontend` | inside the all slice | CSS/HAR/`LocalChromePin` — frontend lane runs the **full** harness because UI tests read `ConfigReader` |

```bash
./gradlew test -Denv=multistack_ci -DincludeTags=harness-backend   # + JaCoCo on ConfigReader
./gradlew test -Denv=multistack_ci -DincludeTags=harness-frontend  # + JaCoCo on CSS helpers
./gradlew test -Denv=multistack_ci -DincludeTags=harness           # full harness (CI default)
```

**Not** application code (that's `unit-tests` on `BACKEND_DIR` / `component-tests` on `FRONTEND_DIR`).

## Mock and screenshot (inside e2e, not layers)

Screenshot tests are **two stages**, not a pyramid layer. Same Selenide classes (`@Layer("e2e")` + `@Tag("screenshot")`); `-Denv` picks the PNG tree.

```
src/test/resources/screenshots/{mock|e2e}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png
```

`multistack_mock` → `mock/`; anything else (ci/prod) → `e2e/`. Third segment is `{browser}-{major}`: `SCREENSHOT_BROWSER` (default `chrome`) plus major from `chrome-for-testing.properties` (same CFT pin as CI `CHROME_FOR_TESTING_VERSION`). Patch (`148.0.7778.178`), headless, and CFT vs Selenoid are **not** path segments — CFT vs Selenoid is mock vs e2e. Different browsers are sibling folders (`chrome-148/` next to a future `firefox-140/`); this job reads only its folder.

`SCREENSHOT_OS` overrides the OS folder (`darwin` → `macos`, `linux` → `linux`, `win32` → `windows`). CI SSOT is `mock/linux/chrome-148` plus the CFT pin. **Do not** set `SCREENSHOT_OS=linux` on a Mac — that would write Linux-canon PNGs from macOS Chrome. On Mac omit `SCREENSHOT_OS` (writes `macos`) or set `SCREENSHOT_OS=macos`.

CI jobs `ui-mock-tests` and `e2e-tests` set `SCREENSHOT_OS=linux` and `SCREENSHOT_BROWSER=chrome`. Screenshot **compare** is a step in each job (mock: every PR; e2e: dispatch `run_screenshot`). Screenshot **rewrite** is a step `Update screenshots` in the same jobs (`update_mock_screenshots` / `update_e2e_screenshots`) — independent flags, not a CD job.

| Slice | Tag | CI |
|-------|-----|-----|
| UI on stub API (mount + error injection) | `@Tag("mock")` (+ `@Tag("e2e")`) | job `ui-mock-tests` step 1: `-DincludeTags=mock` |
| Screenshot vs stub UI | `@Tag("screenshot")` | same job, compare step: `-DincludeTags=screenshot` (every PR; not Playwright) |
| Refresh mock screenshots | `@Tag("screenshot")` + `-DupdateScreenshots=true` | same job, step `Update screenshots` — dispatch `update_mock_screenshots` writes `mock/linux/chrome-148` (skips compare) |
| Flow | `@Tag("e2e")` exclude `screenshot,mock` | job `e2e-tests` (`e2e&prod` on prod) / `e2e-tests-stage` (full `e2e` on stage); default push does **not** run screenshot via Selenoid |
| Screenshot vs live UI | `@Tag("screenshot")` | job `e2e-tests`, compare step — dispatch `run_screenshot` compares `e2e/linux/chrome-148` |
| Refresh e2e screenshots | `@Tag("screenshot")` + `-DupdateScreenshots=true` | job `e2e-tests`, step `Update screenshots` — dispatch `update_e2e_screenshots` writes `e2e/linux/chrome-148` (skips compare; independent of mock rewrite) |

Gradle `includeTags=a,b` is **OR** in this module — keep mock flows and screenshot compare as two steps so they fail separately.
AND is one token with no comma: `api&prod`, `e2e&prod` (JUnit tag expression). Do not write `api,prod`.

Local mock screenshot refresh (Linux / CI writes `mock/linux/chrome-148`; on Mac do **not** force `SCREENSHOT_OS=linux`):

```bash
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=multistack_mock -DincludeTags=screenshot -DupdateScreenshots=true -Dheadless=true
```

Local e2e screenshot refresh (compose ci stand, or `multistack_prod` + Selenoid):

```bash
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=multistack_ci -DincludeTags=screenshot -DupdateScreenshots=true
```

**Mock stand** — browser checks that need controlled `/api/*` JSON, not a live backend.
Stand = `-Denv=multistack_mock`; slice = `-DincludeTags=mock`.

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
./gradlew test -Denv=multistack_mock -DincludeTags=mock
```

Stand registry id: `mock-gateway` (`python scripts/stands/ensure.py mock-gateway` from monorepo root).

The CI job needs no deploy, no prod URL and no Selenoid hub: it brings the profile up on the
runner, runs the slice, then tears it down.

## Two knobs, no layer tasks

When `TESTS_LANG=java`, a layer is a **tag filter**, a stand is **`-Denv`**. There is one Gradle
task — `test`:

```bash
./gradlew test -Denv=multistack_ci   -DincludeTags=harness-backend
./gradlew test -Denv=multistack_ci   -DincludeTags=harness-frontend
./gradlew test -Denv=multistack_ci   -DincludeTags=harness
./gradlew test -Denv=multistack_mock -DincludeTags=mock
./gradlew test -Denv=multistack_mock -DincludeTags=screenshot
./gradlew test -Denv=multistack_stage -DincludeTags=api
./gradlew test -Denv=multistack_stage -DincludeTags=e2e -DexcludeTags=screenshot,mock
./gradlew test -Denv=multistack_prod "-DincludeTags=api&prod"
./gradlew test -Denv=multistack_prod "-DincludeTags=e2e&prod" -DexcludeTags=screenshot,mock
./gradlew test -Denv=multistack_prod -DincludeTags=screenshot
```

| Stand (`-Denv`) | Where it points |
|-----------------|-----------------|
| `multistack_ci` | the compose stack on this machine — UI + real `/api` same origin via `stand-gateway-ci` `:9821`, direct API `:8800` (`docker compose up -d` first) |
| `multistack_mock` | mock profile — UI + stub API same origin `:9911` (`docker compose --profile mock up -d stand-gateway` first) |
| `multistack_stage` | [stage.autotests.ai/stack/backend-java-spring](https://stage.autotests.ai/stack/backend-java-spring), browsers from the Selenoid hub; CI full `api` / `e2e` |
| `multistack_prod` | [autotests.ai/stack/backend-java-spring](https://autotests.ai/stack/backend-java-spring), browsers from the Selenoid hub; CI only `@Tag("prod")` |

Anything else — `headless`, `enableHar`, `enableVideo`, `updateScreenshots`, `allureReportMode` — is a
per-run `-D<key>=<value>`. Available keys: `src/test/resources/config/default.properties`.

For `TESTS_LANG` ∈ `javascript` \| `typescript` \| `python`, CI runs the **full** active-module
suite (`npm test` / `pytest` with `UI_URL` / `BASE_URL`) — no Gradle tag slice yet.

## Layer table

| Layer | Zone | Where | Selector | Run |
|-------|------|-------|----------|-----|
| unit | backend | active `BACKEND_DIR` (default `backend/java/backend-java-spring/`) | java: `-DexcludeTags=integration` (no `@Tag("unit")` job filter; plain + Spring slices) | by `BACKEND_LANG`: gradle+JaCoCo · `pytest` · `go test` · `npm test` — see [backend/README.md](../backend/README.md) |
| component | frontend | active `FRONTEND_DIR` only (default `frontend/typescript/frontend-typescript-react/`) — siblings not CI-gated | Vitest + coverage | `npm test -- --coverage` via `component-tests` |
| integration | backend | `backend/java/backend-java-spring/src/test/java/dev/reference/app/integration/` (`ApplicationWiringIntegrationTest`, `AuthLifecycleIntegrationTest`) | `@Tag("integration")` | `./gradlew test -DincludeTags=integration` in `BACKEND_DIR` via `integration-tests` (after `unit-tests`, **before** build/deploy; PR + main) |
| api | tests | `…/tests/api/` (`AuthApiTests`, `ReferenceApiTests`, `BackendWiringApiTests`, `SeedDataApiTests`, `AuthRoundTripApiTests`) — HTTP contract + deployed-stand facts | `@Tag("api")` (+ optional `@Tag("prod")`) | java → `-DincludeTags=api` via `api-tests-stage` (after `deploy-backend-stage`); prod job `api-tests` uses `api&prod` after `deploy-backend`; retarget any backend with `-DapiBaseUrl` / `-DapiHealthService` |
| e2e | tests | `…/tests/e2e/` | `@Tag("e2e")` (+ optional `screenshot` / `mock` / `prod`) | `ui-mock-tests` (mock flows + screenshot mock PNG); `e2e-tests-stage` (full e2e after `api-tests-stage` + `deploy-frontend-stage`); `e2e-tests` (`e2e&prod` after `api-tests` + `deploy-frontend`; screenshot excluded on default push) |
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
| `unit-tests` | **Application** (active backend — toolchain from `BACKEND_LANG`; excludes `@Tag("integration")`) |
| `integration-tests` | **Application** (full Spring Boot + Testcontainers PostgreSQL in `BACKEND_DIR`) |
| `tests-harness` | **Test tooling** — full helpers except backend-only (`ConfigReader`); frontend keeps ConfigReader because UI tests read it |
| `component-tests` | **Application** (active `FRONTEND_DIR` only — Vitest + coverage → `sonar-frontend` / `ui-mock-tests` → `build-frontend`) |

Students: product unit layers (`unit-tests` / `component-tests`); harness = helper checks that higher layers depend on.

**Slices (java Spring, inside `unit-tests` — not the classical integration layer).**  
After the integration/api split, “slice” means a *partial Spring context* in the backend
module, still `layer=unit` / job `unit-tests`. Allure `suite=slice` (`SliceTestBase`)
separates them from one-class-in-isolation units in the report. Slices are **not** a
sixth pyramid layer; we do **not** promote them to `@Tag("integration")`.

| Slice | Spring test | What it proves | Docker? |
|-------|-------------|----------------|---------|
| Web MVC | `@WebMvcTest` (+ `SecurityChainTest` with a real `JwtService`) | controller / security chain in isolation | no |
| Persistence | `@DataJpaTest` + Testcontainers (`PostgresSliceTestBase`, `postgres:16-alpine`) | Flyway + entities against the same Postgres the app ships with | yes |

Classical **integration** (`backend/…/integration/`, job `integration-tests`) runs the full
Spring context against real PostgreSQL **before** build/deploy. Do not rename Spring slices
to `integration` and do not move deploy HTTP checks into `unit-tests` or backend integration.

The 100% line-coverage gate (`jacocoTestCoverageVerification`) is java-only and slices by
`-DincludeTags` (`harness-backend` → `ConfigReader`; `harness-frontend` → `LayoutCss`/`TokensCss`;
`harness` → all three). `LocalChromePin` is tagged `harness-frontend` (skipped on backend-only CI)
and is **not** in the JaCoCo class set. It reads `build/jacoco/test.exec`.

## Why `component` vs `e2e` (not vs integration)?

| | `component` | `e2e` (incl. mock) |
|---|-----------------|---------------------|
| Runtime | jsdom | real Chrome |
| Object | React SPA units | product pages in a browser |
| Lesson | logic / props / a11y | real CSS / layout / flows |

Integration is **in-process Spring + PostgreSQL**, no browser. Deployed HTTP checks belong under **api**. Chrome checks belong under e2e.

## When each layer runs

| Trigger | Jobs |
|---------|------|
| Pull request (blocks merge) | `unit-tests`, `integration-tests`, `component-tests`, `tests-harness`, `ui-mock-tests`, `sonar-backend`, `sonar-tests`, `sonar-frontend` |
| Push to `main` | PR set + `trigger` lanes → CD stage of this SHA → full api/e2e vs stage → CD production → `api-tests` / `e2e-tests` with `@Tag("prod")` |
| Push to `develop` | PR set + `trigger` lanes → CD stage only → `api-tests-stage` / `e2e-tests-stage` (full `api` / `e2e`, `excludeTags=mock,screenshot`) vs [stage.autotests.ai/stack/…](https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/) |
| `workflow_dispatch` | `deploy=none\|backend\|frontend\|tests\|all` + `deploy_target=production\|stage\|both`; per-layer booleans `run_integration` / `run_api` / `run_mock` / `run_e2e` / `run_screenshot` / `run_manual`; screenshot rewrite flags; TestOps `ALLURE_JOB_RUN_ID` / `ALLURE_USERNAME` |

Active stack and prod URL are workflow `env` defaults in [`ci.yml`](../.github/workflows/ci.yml)
(`BACKEND`, `BACKEND_LANG`, `FRONTEND`, `TESTS`, `TESTS_LANG`) — change once, jobs reuse them.
Job ids are layers or languages, not tools (`e2e-tests`, not `selenide-tests`; `javascript-tests`,
not `playwright-tests`).

Deploy jobs share concurrency group `deploy-autotests-ai-multistack-app` (one checkout dir on the host).
Frontend deploy does **not** wait on backend success.

Nothing runs on a schedule. Full e2e has no PR job: a GitHub runner has no compose stack.
Against **prod** CI runs only `@Tag("prod")`, and only after stage e2e in the same `main` run. Full api/e2e run on **stage** (push `develop` WIP, and again on push `main` before prod). `ui-mock-tests` is the automatic UI gate on PR.

## TestOps (live upload + selective rerun)

`testops-context` opens one shared launch/job-run; **pyramid** jobs stream via workflow
env helper `ALLURECTL_RUN` → `run_with_allurectl` in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (`allurectl watch --job-run-child`).
`tests-harness` does **not** upload (helpers, not product cases). Missing `ALLURE_TOKEN` /
`ALLURE_PROJECT_ID` disables live upload without failing tests — raw `allure-results` still publish.

| Mode | Selection | `ALLURE_KEEP_TESTPLAN` |
|------|-----------|------------------------|
| PR / push / ordinary dispatch | CI layer filters (`-DincludeTags` / npm scripts) | `false` — any TestOps testplan is stripped |
| TestOps UI rerun (`workflow_dispatch` + non-empty `ALLURE_JOB_RUN_ID`) | selective plan from TestOps | `true` — plan kept |

Launch env axes → `allure-results/environment.properties` (TestOps **Окружение** /
Report environment). Written once after each test job by `ALLURE_WRITE_ENVIRONMENT` in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (and again after artifact merge in
`publish-allure-report`), from workflow `env`:

| Env | Value |
|-----|-------|
| `BROWSER` | `Chrome` |
| `OS` | `Linux` |
| `ENDPOINT` | `multistack_prod` (workflow default); stage jobs set `multistack_stage` |
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
`run_screenshot`, `run_manual`) plus `update_mock_screenshots` / `update_e2e_screenshots` and `include_tags`/`exclude_tags` overrides.
To add another layer, copy `manual-tests` and change the java `-D` flags.

## CI cache (Gradle)

CI-only. Writers save GUH + configuration cache (`GRADLE_CC_IF` + `*cache-gradle-cc`). Readers restore GUH **read-only** from `tests-harness` (`GRADLE_BUILD_ACTION_CACHE_KEY_JOB`) and **do not** restore CC. **Do not enable CC on `api-tests` / `e2e-tests` / `api-tests-stage` / `e2e-tests-stage`** (or `ui-mock-tests` / `manual-tests`) — CC pins absolute `GRADLE_USER_HOME` / JaCoCo paths from another runner.

| | Jobs | GUH | CC |
|--|------|-----|-----|
| Writer, backend | `unit-tests`, `integration-tests`, `sonar-backend` | own `github.job` | yes (`backend/java/backend-java-spring`) |
| Writer, tests | `tests-harness`, `sonar-tests` | own `github.job` | yes (tests module) |
| Reader | `ui-mock-tests`, `api-tests`, `e2e-tests`, `api-tests-stage`, `e2e-tests-stage`, `manual-tests` | read-only from `tests-harness` | **no** |

## Test data and secrets

- Register-flow tests (api / e2e) create `user_*` accounts and **delete them**
  through `DELETE /api/auth/me` (`AuthApiClient.deleteAccountQuietly`). They are **not**
  `@Tag("prod")` — the main→prod slice is seeded GET + login only. Stage (full layer) still
  runs register against [stage.autotests.ai](https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/).
  The lifecycle round-trip also documents stateless logout: the JWT
  survives `logout` and dies with the account.
- `multistack_prod.properties` / `multistack_stage.properties` commit the **creds-less** hub URL. CI passes the real one via
  the `SELENOID_REMOTE_URL` secret (`-DremoteUrl=…` in `e2e-tests` / `e2e-tests-stage`);
  locally export it the same way when you need the shared hub.

## CD graph

Matches [`ci.yml`](../.github/workflows/ci.yml) `needs` (Sonar ×3 gates **deploy**, not build;
FE lane: `component-tests` → `ui-mock-tests` → `sonar-frontend`; mock also gates `build-frontend`):

```
every run (PR + main):
  unit-tests → integration-tests
  unit-tests + integration-tests → sonar-backend
  component-tests → ui-mock-tests → sonar-frontend
  tests-harness → sonar-tests (sonar-tests skipped on backend-only lane)
  ui-mock-tests (needs component-tests + trigger + testops; every PR; frontend lane on main)

main (via `trigger.cd_stage` then `cd_production`):
  same builds (main|develop)
  deploy-backend-stage / deploy-frontend-stage ← STAGE_APP_DIR
  api-tests-stage ← deploy-backend-stage; full includeTags=api vs stage
  e2e-tests-stage ← api-tests-stage + deploy-frontend-stage; full e2e exclude mock,screenshot
  deploy-backend ← build-backend + sonar-backend + e2e-tests-stage
  deploy-frontend ← build-frontend + sonar-frontend + e2e-tests-stage
  api-tests ← deploy-backend (or tests-lane vs live stand); includeTags=api&prod
  e2e-tests ← api-tests + deploy-frontend; includeTags=e2e&prod excludeTags=mock,screenshot
  manual-tests: dispatch (needs e2e-tests + testops)

develop (via `trigger.cd_stage` only — no prod):
  same builds (main|develop)
  deploy-backend-stage / deploy-frontend-stage ← STAGE_APP_DIR
  api-tests-stage ← deploy-backend-stage; full includeTags=api vs stage
  e2e-tests-stage ← api-tests-stage + deploy-frontend-stage; full e2e exclude mock,screenshot
```

Push/dispatch on `main` and `develop` share workflow concurrency `ci-cd-stands`
(`cancel-in-progress: false`). One stage host: they queue, they do not interleave.
PRs stay `ci-pr-<ref>` and may cancel in progress.

`api-tests` gates on `deploy-backend` (not a join with frontend). `api-tests-stage` is the same vs `deploy-backend-stage`. `integration-tests` runs in `BACKEND_DIR` before
build/deploy and does **not** wait on deploy.
`sonar-tests` scans **testinfra helpers** (`-DincludeTags=harness`), not api/e2e results.
It runs after `tests-harness` on **PR** and **main**, except the backend-only lane
(`harness-backend` only — no full tests-module coverage to gate).
`build-backend` / `build-frontend` do **not** `needs` Sonar. `sonar-frontend` waits on
`ui-mock-tests` (success or skipped — backend-only lane still scans). There is no
`build-frontend` → `ui-mock-tests` edge (mock does not wait for the GHCR image) and no
deploy → `integration-tests` edge.
