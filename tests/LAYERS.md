# Test layers (canonical map)

Teaching pyramid for autotests-ai-multistack-app — **classical** names (ISTQB-style):
unit → integration (wired, no UI) → api → ui → e2e → manual.
**One** CI file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(pyramid + Allure 3 / TestOps / Notifications + JaCoCo + Sonar quality axis).  
Module folders: `-` between segments, `_` in compounds (`react_testing_library`, `no_allure`).

```
                    ┌─────────────┐
                    │   manual    │  in code — exploratory stubs (@Manual + steps)
                    ├─────────────┤
                    │     e2e     │  live stand + real backend (@Tag e2e)
                    ├─────────────┤
                    │     ui      │  browser SPA on stub API (@Tag ui; job ui-tests)
                    ├─────────────┤     component — jsdom job (Vitest), not a pyramid layer
                    │     api     │  HTTP contract (@Tag api — any client / language)
                    ├─────────────┤
                    │ integration │  Spring app + real PG, no deploy (@Tag integration)
                    ├─────────────┤
                    │    unit     │  backend product; CI `-DexcludeTags=integration`
                    └─────────────┘
```

Six classical layers: unit → integration → api → ui → e2e → manual.  
`component` sits **beside** the ladder (frontend jsdom job), not between unit and integration, not inside `tests/<lang>/…`.  
DS catalog Selenide checks live in `design-system-home` — not duplicated here.

**Not classical:** calling Chrome “mount” checks `integration`. Those are **ui** (`@Tag("ui")` + `@Tag("mock")`).  
**Not classical either:** Spring `@WebMvcTest` / `@DataJpaTest` — those stay in **unit** (see slices below).  
**Not a pyramid language:** `tests/go/tests-go-cdp` mills IR via `greedy run` (`layers: [crystal]`, crystal column on `/stack/`). Not `@Layer`.  
**Not a pyramid layer:** load slots — JMeter (`tests-java-jmeter`, `tests-groovy-jmeter`) · Gatling (`tests-java-gradle-gatling`, `tests-kotlin-gradle-gatling`, `tests-scala-gatling`, `tests-javascript-gatling`, `tests-typescript-gatling`) · k6 (`tests-javascript-k6`, `tests-typescript-k6`) · Locust (`tests-python-locust`) · Yandex.Tank (`tests-python-yandex-tank`). `layers: [performance]` on `/stack/` Tests board. Not `@Layer`.  
**Go living HTTP block:** `tests/go/tests-go-testing-allure3-net_http` — `go test` + net/http + testify + official Allure Go, `layers: [api]`. Same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). UI block is slot `tests-go-testing-allure3-playwright`. Mill stays `tests-go-cdp`. Not Gomega.

**Java Selenium living block:** `tests/java/tests-java-gradle-junit5-allure3-selenium` — raw WebDriver + Rest Assured, `layers: [api, ui, e2e]`. Not the Selenide default cell.

**Java HTTP-only living blocks:** `tests-java-gradle-junit5-allure3-restassured` (Rest Assured) and `tests-java-gradle-junit5-allure3-retrofit2` (Retrofit 2) — `layers: [api]`. Same `/api` contract. Combo Selenium+Retrofit = generate, not a third folder.

**Python HTTP-only living block:** `tests-python-httpx` — pytest + httpx, `layers: [api]`. Same `/api` contract as Java Rest Assured. `tests-python-requests` stays a slot. Combo with Selenium = generate, not a third folder. Selene already has httpx in-cell. Playwright Python uses APIRequest in-cell, not httpx.

**Python Selene living block:** `tests-python-selene` — pytest + Selene + in-cell httpx, `layers: [api, ui, e2e]`. Same UI `DisplayName` catalog as Java Selenide. pytest-cov **100%** on `config.py`. Default CI cell stays Java Selenide. Sibling UI school stays `tests-python-selenium`. HTTP-only httpx school stays in the sibling folder.

**Python Playwright living block:** `tests-python-playwright` — pytest + Playwright + in-cell **APIRequest**, `layers: [api, ui, e2e]`. Same UI `DisplayName` catalog as Java Playwright. pytest-cov **100%** on `config.py`. Default CI cell stays Java Selenide. Not a Selenium/Selene rewrite. HTTP-only httpx school stays in the sibling folder.

**TypeScript HTTP-only living block:** `tests-typescript-axios` — Vitest + axios, `layers: [api]`. Same `/api` catalog (5 api + infra + manual). Titles/schemas match `tests-typescript-playwright` `tests/api`. `tests-javascript-axios` stays a slot. Combo with Playwright = generate, not a third folder.

**Kotlin HTTP-only living block:** `tests-kotlin-gradle-junit5-allure3-ktor` — Gradle + JUnit 5 + Ktor client, `layers: [api]`. Same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). UI schools are living `tests-kotlin-gradle-junit5-allure3-selenide` (Selenide + **in-cell** Ktor) and `tests-kotlin-gradle-junit5-allure3-selenium` (Selenium + **in-cell** Ktor), not a second HTTP folder. Playwright Kotlin slot stays empty. Kotest+Ktor emit is niche, not a second folder.

**Kotlin Selenide living block:** `tests-kotlin-gradle-junit5-allure3-selenide` — Gradle + JUnit 5 + Selenide + in-cell Ktor, `layers: [api, ui, e2e]`. Same UI `DisplayName` catalog as Java Selenide. JaCoCo 100% `ConfigReader` / `LayoutCss` / `TokensCss`. Default CI cell stays Java Selenide.

**Kotlin Selenium living block:** `tests-kotlin-gradle-junit5-allure3-selenium` — Gradle + JUnit 5 + Selenium 4 + in-cell Ktor, `layers: [api, ui, e2e]`. Same UI `DisplayName` catalog as Java Selenium. JaCoCo 100% `ConfigReader` / `LayoutCss` / `TokensCss`. Default CI cell stays Java Selenide. Not a Selenide/Playwright rewrite. HTTP-only Ktor school stays in the sibling folder.

**C# HTTP-only living block:** `tests-csharp-nunit-allure3-restsharp` — NUnit + RestSharp + Allure.NUnit, `layers: [api]`. Same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). UI stays in NUnit Selenium / xUnit Playwright siblings. Combo with a UI school = generate, not a third folder.

**HTTP-only slots (other languages):** empty folders, `layers: [api]`, same `/api` contract. Python `tests-python-requests` · JS `tests-javascript-axios`. Go living catalog is `tests-go-testing-allure3-net_http`. Kotlin living catalog is `tests-kotlin-gradle-junit5-allure3-ktor`. C# living catalog is `tests-csharp-nunit-allure3-restsharp`. Combo with a UI school = generate, not a third folder.

**JS/TS Playwright living:** api inside `tests-javascript-playwright` / `tests-typescript-playwright` is Playwright **APIRequest** (`request` fixture). Axios is the sibling HTTP-only school, not the client in those folders. Java Playwright uses Rest Assured in-cell (JVM HTTP school). Python Playwright uses APIRequest in-cell (not httpx).

**Java Playwright living block:** `tests-java-gradle-junit5-allure3-playwright` — Playwright for Java + Rest Assured, `layers: [api, ui, e2e]`. Same `data-testid` as the TS Playwright cell; screenshot PNG tree matches Selenide (`@Tag("screenshot")` slice). HTTP-only Rest Assured school stays in `tests-java-gradle-junit5-allure3-restassured`.

## integration vs api — intent, not tag

**integration** = full Spring Boot context against real PostgreSQL (Testcontainers) in the
**backend module**, before build/deploy. Proves the application wires Controller → Service →
Repository → Postgres and Flyway seed — not HTTP against a live stand.

**api** = HTTP contract and deployed-stand facts through Rest Assured or Retrofit 2 **after**
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
- Run: `./gradlew test -Denv=prod -DincludeTags=manual` · job `manual-tests` (dispatch)

Same repo, same review/PR flow as automated layers. Promote a stub to e2e by replacing steps
with real Selenide/API calls and retagging — do not keep a parallel wiki checklist.

## Infra tests (not a pyramid layer)

Self-check of the **tests module helpers** before / alongside product layers — umbrella `@Tag("infra")`, one CI job:

| Slice | Tags | CI | Gates |
|-------|------|----|-------|
| all | `infra` | `infra-tests` | PR · frontend · tests · mixed/`all`; feeds `sonar-tests` |
| backend-only | `infra-backend` | same job | backend lane — `ConfigReader` only; **skips** `sonar-tests` |
| frontend helpers | `infra` + `infra-frontend` | inside the all slice | CSS/HAR/local browser pin (`LocalChromePin` = local Chrome for Testing; other browsers skip it) — frontend lane runs the **full** infra because UI tests read `ConfigReader` |

```bash
./gradlew test -Denv=ci -DincludeTags=infra-backend jacocoTestCoverageVerification   # 100% ConfigReader
./gradlew test -Denv=ci -DincludeTags=infra-frontend jacocoTestCoverageVerification  # 100% CSS helpers
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification           # full infra (CI default)
```

Living non-JVM cells ship a ConfigReader analog (command on the cell README). Mill `tests-go-cdp` and empty slots do not.

| Cell | Local | Gate | CI `sonar-tests` |
|------|-------|------|------------------|
| Java + Kotlin Ktor + Kotlin Selenide + Kotlin Selenium | `jacocoTestCoverageVerification` | 100% ConfigReader (Java/Kotlin UI cells also CSS helpers on full infra) | Gradle `sonar` + JaCoCo xml |
| JS / TS Playwright | `npm run test:infra` | c8 lcov, **no** fail-under | `@sonar/scan` + lcov (`sonar-project.properties`) |
| Python Selenium | `pytest -m infra --cov=config --cov=api_client --cov=har_capture` | report, **no** fail-under | `@sonar/scan` + `coverage.xml` |
| Python Selene | `pytest -m infra --cov=config --cov-fail-under=100` | 100% `config.py` | same Python action + cell `sonar-project.properties` |
| Python Playwright | `pytest -m infra --cov=config --cov-fail-under=100` | 100% `config.py` | same Python action + cell `sonar-project.properties` |
| Python httpx | `pytest -m infra --cov=config --cov-fail-under=100` | 100% `config.py` | same Python action + cell `sonar-project.properties` |
| TS axios | `npx vitest run --tagsFilter infra --coverage` | 100% lines on `config.ts` | same TS action + cell `sonar-project.properties` |
| Go net/http | `./cover-config.sh` | 100% ConfigReader analog | `@sonar/scan` + `coverage.out` |
| C# RestSharp | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` | 100% `Config.ConfigReader` | `@sonar/scan` + opencover |

**Not** application code (that's `backend-unit-tests` on `BACKEND_DIR` / `frontend-unit-tests` on `FRONTEND_DIR`).

## Mock and screenshot (ui vs e2e; screenshot is not a layer)

Screenshot tests are **two stages**, not a pyramid layer. Same PNG tree. Chrome / form PNG: `@Layer("ui")` + `@Tag("ui")` + `@Tag("screenshot")`. Welcome-panel after login: `@Layer("e2e")` + `@Tag("e2e")` + `@Tag("screenshot")`. Stand is `-Denv`. Python: `pytest.mark.ui` or `pytest.mark.e2e` + `pytest.mark.screenshot`. Mock is a slice **inside ui** (`@Tag("mock")`), not a substitute for `@Tag("ui")`.

```
src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png
```

`mock` → `mock/`; `stage` → `stage/`; `prod` and `ci` → `prod/`. Third segment is `{browser}-{major}`: `SCREENSHOT_BROWSER` (default `chrome`) plus major from `chrome-for-testing.properties` (same CFT pin as CI `CHROME_FOR_TESTING_VERSION`). Patch (`148.0.7778.178`), headless, and CFT vs Selenoid are **not** path segments. Different browsers are sibling folders (`chrome-148/` next to a future `firefox-140/`); this job reads only its folder.

`SCREENSHOT_OS` overrides the OS folder (`darwin` → `macos`, `linux` → `linux`, `win32` → `windows`). CI SSOT is `mock/linux/chrome-148` plus the CFT pin. **Do not** set `SCREENSHOT_OS=linux` on a Mac — that would write Linux-canon PNGs from macOS Chrome. On Mac omit `SCREENSHOT_OS` (writes `macos`) or set `SCREENSHOT_OS=macos`.

CI jobs `ui-tests` and `e2e-tests` set `SCREENSHOT_OS=linux` and `SCREENSHOT_BROWSER=chrome`. Screenshot **compare** is a step in each job (mock: every PR; e2e-tests and e2e-tests-stage: always, unless rewriting). Screenshot **rewrite** is a step `Update screenshots` in the same jobs (`update_mock_screenshots` / `update_e2e_screenshots` / `update_stage_screenshots`) — independent flags, not a CD job.

| Slice | Tag | CI |
|-------|-----|-----|
| UI on stub API (mount + error injection + header chrome) | `@Tag("ui")` (+ optional `@Tag("mock")`) | job `ui-tests` step 1: `-DincludeTags=ui -DexcludeTags=screenshot` |
| Screenshot vs stub UI | `@Tag("screenshot")` / `-m screenshot` / `--grep @screenshot` | same job, compare step: java `-DincludeTags=screenshot` · python `-m screenshot` · javascript/typescript `--grep @screenshot` (every PR) |
| Refresh mock screenshots | `@Tag("screenshot")` + update flag | same job, step `Update screenshots` — dispatch `update_mock_screenshots` writes `mock/linux/chrome-148` (skips compare; java `-DupdateScreenshots=true` · python `UPDATE_SCREENSHOTS=true`) |
| Flow through live backend | `@Tag("e2e")` exclude `screenshot` | job `e2e-tests` (`-Denv=prod -DincludeTags=e2e`) / `e2e-tests-stage` (`-Denv=stage`); PNG compare is a second step |
| Screenshot vs live UI | `@Tag("screenshot")` / `-m screenshot` | same jobs, compare step — `stage/linux/chrome-148` and `prod/linux/chrome-148` |
| Refresh prod screenshots | `@Tag("screenshot")` + update flag | job `e2e-tests`, step `Update screenshots` — dispatch `update_e2e_screenshots` writes `prod/linux/chrome-148` (skips compare; independent of mock rewrite) |

Gradle `includeTags=a,b` is **OR** in this module — keep mock flows and screenshot compare as two steps so they fail separately.
Python: `-m mock` and `-m screenshot` are two pytest runs in the same CI job for the same reason.
AND is one token with no comma: `api&smoke` (JUnit tag expression). Do not write `api,smoke` when you mean AND.
Prod is a stand (`-Denv=prod` / `STAND=prod`), not a layer tag.

Local mock screenshot refresh (Linux / CI writes `mock/linux/chrome-148`; on Mac do **not** force `SCREENSHOT_OS=linux`):

```bash
# java — tests/java/tests-java-gradle-junit5-allure3-selenide
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot -DupdateScreenshots=true -Dheadless=true

# python — tests/python/tests-python-selenium · tests-python-selene · tests-python-playwright
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true pytest -m screenshot

# javascript / typescript — tests/{javascript,typescript}/tests-*-playwright
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true npx playwright test --grep @screenshot
```

Local e2e screenshot refresh (compose ci stand, or `prod` + Selenoid):

```bash
# java
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=ci -DincludeTags=screenshot -DupdateScreenshots=true

# python
SCREENSHOT_BROWSER=chrome STAND=ci UPDATE_SCREENSHOTS=true pytest -m screenshot

# javascript / typescript
SCREENSHOT_BROWSER=chrome STAND=ci UPDATE_SCREENSHOTS=true npx playwright test --grep @screenshot
```

**Mock stand** — browser checks that need controlled `/api/*` JSON, not a live backend.
Java: stand = `-Denv=mock`, slice = `-DincludeTags=ui`. Python: stand = `STAND=mock`, slice = `-m ui`. Javascript: stand = `STAND=mock` / `UI_URL=http://127.0.0.1:9911/`, slice = `--grep @ui`.

The SPA is served at document root and resolves API to `/api`; the frontend container nginx
has no `/api` route, so a **stand-gateway** (compose profile `mock`, port **9911**) proxies
`/` → frontend and `/api/` → WireMock stubs in `deploy/mock/mappings/`. Default stubs answer
the same shapes as the real controllers (incl. `401` on `/api/auth/me` without a bearer).
The gateway also proxies WireMock admin at `/__admin/` for scenario switches.

Two `@Tag("mock")` flavours in the same **ui** job (plus header/chrome tests that are `@Tag("ui")` only):

| Flavour | What | Classes / mechanism |
|---------|------|---------------------|
| Mount (happy stubs) | layout / form chrome with a healthy stub API | `HomeLayoutTests`, `LoginFormTests`, `LoginEmbedTests`, `RegisterFormTests` |
| Error injection | UI error panels a live backend can never produce | `HomeErrorStateTests` — `MockScenarios` flips WireMock scenarios `items` / `health` to state `error` → mappings `items-error.json` / `health-error.json` answer `500` |

On stands without `/__admin/` (ci/prod) the error-injection tests **skip by JUnit assumption**
instead of failing — same suite, honest report. Happy-mount tests need only the stub
mappings; they do not call admin.

```bash
docker compose --profile mock up -d stand-gateway   # :9911 + api-mock + react frontend
./gradlew test -Denv=mock -DincludeTags=ui
STAND=mock pytest -m ui        # from tests/python/tests-python-selenium, tests-python-selene, or tests-python-playwright
STAND=mock pytest -m screenshot
```

Stand registry id: `mock-gateway` (`python scripts/stands/ensure.py mock-gateway` from monorepo root).

The CI job needs no deploy, no prod URL and no Selenoid hub: it brings the profile up on the
runner, runs the slice, then tears it down.

## Two knobs, no layer tasks

When `TESTS_LANG=java`, a layer is a **tag filter**, a stand is **`-Denv`**. There is one Gradle
task — `test`:

```bash
./gradlew test -Denv=ci   -DincludeTags=infra-backend
./gradlew test -Denv=ci   -DincludeTags=infra-frontend
./gradlew test -Denv=ci   -DincludeTags=infra
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
./gradlew test -Denv=mock -DincludeTags=screenshot
./gradlew test -Denv=stage -DincludeTags=api
./gradlew test -Denv=stage -DincludeTags=e2e -DexcludeTags=screenshot
./gradlew test -Denv=prod -DincludeTags=api
./gradlew test -Denv=prod -DincludeTags=e2e -DexcludeTags=screenshot
./gradlew test -Denv=prod -DincludeTags=screenshot
```

| Stand (`-Denv` / `STAND`) | Where it points |
|-----------------|-----------------|
| `ci` | the compose stack on this machine — UI + real `/api` same origin via `stand-gateway-ci` `:9821`, direct API `:8800` (`docker compose up -d` first) |
| `mock` | mock profile — UI + stub API same origin `:9911` (`docker compose --profile mock up -d stand-gateway` first) |
| `stage` | [stage.autotests.ai/stack/backend-java-spring](https://stage.autotests.ai/stack/backend-java-spring), browsers from the Selenoid hub; CI full `api` / `e2e` |
| `prod` | [autotests.ai/stack/backend-java-spring](https://autotests.ai/stack/backend-java-spring), browsers from the Selenoid hub; CI full `api` / `e2e` (`-Denv=prod`) |

Anything else — `headless`, `enableHar`, `enableVideo`, `updateScreenshots`, `allureReportMode` — is a
per-run `-D<key>=<value>`. Available keys: `src/test/resources/config/default.properties`.

For `TESTS_LANG=python`, a layer is a **pytest marker**, a stand is **`STAND`** / `BASE_URL`
(from `tests/python/tests-python-selenium`, `tests-python-selene`, or `tests-python-playwright`):

```bash
STAND=ci   pytest -m infra_backend
STAND=ci   pytest -m infra_frontend
STAND=ci   pytest -m infra
STAND=mock pytest -m 'ui and not screenshot'
STAND=mock pytest -m screenshot
STAND=stage pytest -m api
STAND=stage pytest -m 'e2e and not screenshot'
STAND=prod pytest -m api
STAND=prod pytest -m 'e2e and not screenshot'
STAND=prod pytest -m screenshot
```

Per-run env: `HEADLESS`, `UPDATE_SCREENSHOTS`, `SCREENSHOT_OS`, `SCREENSHOT_BROWSER`, `SELENOID_WEBDRIVER_URL` (Playwright cells: `SELENOID_PLAYWRIGHT_URL`).
Same contract questions as the Java default cell. Do **not** set `SCREENSHOT_OS=linux` on a Mac.

For `TESTS_LANG=javascript`, a layer is a **Playwright tag**, a stand is **`UI_URL`** / `STAND` / `API_BASE_URL`
(from `tests/javascript/tests-javascript-playwright`):

```bash
npx playwright test --grep @infra_backend
npx playwright test --grep @infra
STAND=mock UI_URL=http://127.0.0.1:9911/ npx playwright test --grep @ui --grep-invert @screenshot
STAND=mock UI_URL=http://127.0.0.1:9911/ npx playwright test --grep @screenshot
npx playwright test --grep @api
npx playwright test --grep @e2e --grep-invert @screenshot
npx playwright test --grep @manual
```

For `TESTS_LANG=typescript`, a layer is a **Playwright tag**, a stand is **`UI_URL`** / `STAND` / `API_BASE_URL`
(from `tests/typescript/tests-typescript-playwright`) — same commands as javascript.

For `TESTS_LANG=go`, a layer is a **package path**, a stand is **`STAND`** / `API_BASE_URL`
(from `tests/go/tests-go-testing-allure3-net_http`):

```bash
STAND=ci   go test ./tests/infra
STAND=prod go test ./tests/api
STAND=prod go test ./tests/manual
```

For `TESTS_LANG=kotlin`, a layer is a **tag filter**, a stand is **`-Denv`**.
HTTP-only: `tests/kotlin/tests-kotlin-gradle-junit5-allure3-ktor`. UI+HTTP:
`tests/kotlin/tests-kotlin-gradle-junit5-allure3-selenide` or
`tests/kotlin/tests-kotlin-gradle-junit5-allure3-selenium` (clone default `TESTS_*` stays Java Selenide).

```bash
./gradlew test -Denv=ci   -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci   -DincludeTags=api
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
./gradlew test -Denv=ci   -DincludeTags=e2e -DexcludeTags=screenshot
./gradlew test -Denv=prod -DincludeTags=manual
```

For `TESTS_LANG=csharp`, a layer is an **NUnit category**, a stand is **`STAND`** / `API_BASE_URL`
(from `tests/csharp/tests-csharp-nunit-allure3-restsharp`):

```bash
STAND=ci   dotnet test --filter TestCategory=infra
STAND=prod dotnet test --filter TestCategory=api
STAND=prod dotnet test --filter TestCategory=manual
```

## Layer table

| Layer | Zone | Where | Selector | Run |
|-------|------|-------|----------|-----|
| unit | backend | active `BACKEND_DIR` (default `backend/java/backend-java-spring/`) | java: `-DexcludeTags=integration` (no `@Tag("unit")` job filter; plain + Spring slices) | `./backend/.github/actions/unit` → `./gradlew test jacocoTestReport …` |
| component | frontend | active `FRONTEND_DIR` only (default `frontend/typescript/frontend-typescript-react/`) — siblings not CI-gated | Vitest + coverage | `npm test -- --coverage` via `frontend-unit-tests` |
| integration | backend | `backend/java/backend-java-spring/src/test/java/dev/reference/app/integration/` (`ApplicationWiringIntegrationTest`, `AuthLifecycleIntegrationTest`) | `@Tag("integration")` | `./gradlew test -DincludeTags=integration` in `BACKEND_DIR` via `integration-tests` (after `backend-unit-tests`, **before** build/deploy; PR + main) |
| api | tests | `…/tests/api/` (`AuthApiTests`, `ReferenceApiTests`, `BackendWiringApiTests`, `SeedDataApiTests`, `AuthRoundTripApiTests`) — HTTP contract + deployed-stand facts | `@Tag("api")` | java → `-DincludeTags=api` via `api-tests-stage` (`-Denv=stage`) and `api-tests` (`-Denv=prod`); retarget any backend with `-DapiBaseUrl` / `-DapiHealthService` |
| ui | tests | `…/tests/ui/` (layout, header, form chrome, error injection, chrome screenshots) | `@Tag("ui")` (+ optional `mock` / `screenshot`) | `ui-tests` (`-Denv=mock -DincludeTags=ui`; screenshot compare is a second step) |
| e2e | tests | `…/tests/e2e/` (login, register, session, home load, welcome-panel screenshot) | `@Tag("e2e")` (+ optional `screenshot`) | `e2e-tests-stage` (`-Denv=stage` after `api-tests-stage` + `deploy-frontend-stage`); `e2e-tests` (`-Denv=prod -DincludeTags=e2e` after `api-tests` + `deploy-frontend`; screenshot excluded on default push) |
| manual | tests | `…/tests/manual/` **in code** | `@Tag("manual")` + `@Manual` | java → `-DincludeTags=manual` via `manual-tests` (after `e2e-tests`, dispatch) |

### Frontend reference modules (not interchangeable)

| Role | Module | Why |
|------|--------|-----|
| UX / product code (no Vitest) | `frontend-javascript-vanilla` | Teaching SPA without a framework runner — Session markup, auth wiring, copy |
| Vitest / component + deploy | `frontend-typescript-react` | CI `FRONTEND` default (`:9811`); `frontend-unit-tests` / sonar / build / deploy follow this knob |

`frontend-javascript-react` is the JS twin — keep contract parity locally; CI does **not** matrix sibling frontends. Flip `FRONTEND` / `FRONTEND_DIR` together when the teaching default changes.  
Do **not** add Vitest to vanilla; do **not** set `FRONTEND` to vanilla (no npm runner).

Bare `./gradlew test` (java) runs **everything**, integration included — there are no hidden excludes.

Active teaching module defaults: `tests/{TESTS_LANG}/tests-{TESTS_LANG}-{TESTS_BUILDER}-{TESTS_FRAMEWORK}-{TESTS_REPORT}-{TESTS_UI_LIBRARY}/` (`java` · `gradle` · `junit5` · `allure3` · `selenide`).  
Paths SSOT: `backend/scripts/paths.sh`. Module naming: [NAMING.md](NAMING.md).  
Suite **stems** (one Java class → one Playwright spec / one pytest module, idiomatic suffixes): [NAMING.md](NAMING.md) § Suite file stems.

## Why `unit` and `infra`? (and why Spring “slices” ≠ integration)

| Job | Product under test |
|-----|--------------------|
| `backend-unit-tests` | **Application** (active `BACKEND_DIR` via `./backend/.github/actions/unit`; excludes `@Tag("integration")`) |
| `integration-tests` | **Application** (full Spring Boot + Testcontainers PostgreSQL in `BACKEND_DIR`) |
| `infra-tests` | **Test tooling** — full helpers except backend-only (`ConfigReader`); frontend keeps ConfigReader because UI tests read it |
| `frontend-unit-tests` | **Application** (active `FRONTEND_DIR` only — Vitest + coverage → `sonar-frontend` / `ui-tests` → `build-frontend`) |

Students: product unit layers (`backend-unit-tests` / `frontend-unit-tests`); infra = helper checks that higher layers depend on.

**Slices (java Spring, inside `backend-unit-tests` — not the classical integration layer).**  
After the integration/api split, “slice” means a *partial Spring context* in the backend
module, still `layer=unit` / job `backend-unit-tests`. Allure `suite=slice` (`SliceTestBase`)
separates them from one-class-in-isolation units in the report. Slices are **not** a
sixth pyramid layer; we do **not** promote them to `@Tag("integration")`.

| Slice | Spring test | What it proves | Docker? |
|-------|-------------|----------------|---------|
| Web MVC | `@WebMvcTest` (+ `SecurityChainTest` with a real `JwtService`) | controller / security chain in isolation | no |
| Persistence | `@DataJpaTest` + Testcontainers (`PostgresSliceTestBase`, `postgres:16-alpine`) | Flyway + entities against the same Postgres the app ships with | yes |

Classical **integration** (`backend/…/integration/`, job `integration-tests`) runs the full
Spring context against real PostgreSQL **before** build/deploy. Do not rename Spring slices
to `integration` and do not move deploy HTTP checks into `backend-unit-tests` or backend integration.

The 100% line-coverage gate (`jacocoTestCoverageVerification`) is **JVM** (Java living cells + Kotlin Ktor / Selenide / Selenium) and slices by
`-DincludeTags` (`infra-backend` → `ConfigReader`; `infra-frontend` → `LayoutCss`/`TokensCss`;
`infra` → all three). `LocalChromePin` (local Chrome for Testing; other browsers skip it) is
tagged `infra-frontend` (skipped on backend-only CI) and is **not** in the JaCoCo class set.
It reads `build/jacoco/test.exec`.

Other living HTTP schools report helper coverage without copying JaCoCo: Python `pytest-cov` (CI: no fail-under; httpx / Selene / Playwright can `--cov=config --cov-fail-under=100` locally) · JS/TS Playwright `c8` (no fail-under) · Go `go test -cover` on ConfigReader analog (`./cover-config.sh`) · TypeScript axios Vitest v8 on `config.ts`.

## Why `component` vs `ui` vs `e2e` (not vs integration)?

| | `component` | `ui` | `e2e` |
|---|-----------------|------|-------|
| Runtime | jsdom | real Chrome | real Chrome |
| Backend | none | WireMock stubs | live `/api` |
| Object | React SPA units | product pages, chrome, layout | user journeys through the stack |
| Lesson | logic / props / a11y | real CSS / forms / error panels | login, session, catalogue |

Integration is **in-process Spring + PostgreSQL**, no browser. Deployed HTTP checks belong under **api**. Browser-on-stub belongs under **ui**. Browser-on-live-backend belongs under **e2e**.

## When each layer runs

| Trigger | Jobs |
|---------|------|
| Pull request (blocks merge) | `backend-unit-tests`, `integration-tests`, `frontend-unit-tests`, `infra-tests`, `ui-tests`, `sonar-backend`, `sonar-tests`, `sonar-frontend` |
| Push to `main` | PR set + `trigger` lanes → CD stage of this SHA → full api/e2e vs stage → CD production → `api-tests` / `e2e-tests` (`-Denv=prod`, same layer tags) |
| Push to `develop` | PR set + `trigger` lanes → CD stage only → `api-tests-stage` / `e2e-tests-stage` (full `api` / `e2e`, `excludeTags=screenshot`) vs [stage.autotests.ai/stack/…](https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/) |
| `workflow_dispatch` | `deploy=none\|backend\|frontend\|tests\|all` + `deploy_target=production\|stage\|both`; per-layer booleans `run_integration` / `run_api` / `run_mock` / `run_e2e` / `run_screenshot` / `run_manual`; screenshot rewrite flags; TestOps `ALLURE_JOB_RUN_ID` / `ALLURE_USERNAME` |

Active stack knobs are workflow `env` in [`ci.yml`](../.github/workflows/ci.yml)
(`BACKEND_LANG` + `BACKEND_FRAMEWORK`, `FRONTEND_LANG` + `FRONTEND_FRAMEWORK`,
`TESTS_LANG` + `TESTS_BUILDER` + `TESTS_FRAMEWORK` + `TESTS_REPORT` + `TESTS_UI_LIBRARY`).
Job ids are layers or languages, not tools (`e2e-tests`, not `selenide-tests`; `javascript-tests`,
not `playwright-tests`).

Deploy jobs share concurrency group `deploy-autotests-ai-multistack-app` (one checkout dir on the host).
Frontend deploy does **not** wait on backend success.

Nothing runs on a schedule. Full e2e has no PR job: a GitHub runner has no compose stack.
Against **prod** CI runs the same layer tags as stage (`api` / `e2e`), with `-Denv=prod`, after stage e2e in the same `main` run. Full api/e2e also run on **stage** (push `develop` WIP, and again on push `main` before prod). `ui-tests` is the automatic UI gate on PR.

## Allure quality gate vs GitHub

Telegram / report **Allure quality gate** is the teaching verdict for the whole run. The donut and tests table stay on Allure results only (a lint failure before Vitest does not invent a failed test).

After generate, [`attach-ci-jobs-quality-gate.mjs`](java/tests-java-gradle-junit5-allure3-selenide/allure/attach-ci-jobs-quality-gate.mjs) folds GitHub `needs.*.result` into that widget:

| GitHub result | Allure QG |
|---------------|-----------|
| `failure` on a layer job (tests, biome, infra, …) | not passed |
| `skipped` because this event does not run that job (PR without prod e2e, `manual-tests` on push, lane `if:`) | unchanged |
| Sonar / deploy | own widgets or out of Allure QG |

Layer jobs: `backend-unit-tests`, `frontend-unit-tests`, `infra-tests`, `ui-tests`, `integration-tests`, `api-tests-stage`, `e2e-tests-stage`, `api-tests`, `e2e-tests`, `manual-tests`. Widget rule id: `maxCiJobFailures` (attached after generate, not an Allure CLI `use` rule).

CLI (`npx allure quality-gate`) also runs `maxFailures` plus reporting via `qualityGate.use`: steps on api / integration / ui / e2e / manual, and attachments on `@Tag("screenshot")` (nested step PNGs count; AllureSelenide stays `screenshots(false)`).

## TestOps (live upload + selective rerun)

`trigger` opens one shared TestOps launch/job-run (same job as lane flags); **layer** jobs stream via
`run_with_allurectl` in
[`.github/actions/setup-allurectl/allurectl-run.sh`](../.github/actions/setup-allurectl/allurectl-run.sh)
(`allurectl watch --job-run-child`).
`infra-tests` does **not** upload (helpers, not product cases). Missing `ALLURE_TOKEN` /
`ALLURE_PROJECT_ID` disables live upload without failing tests — raw `allure-results` still publish.

| Mode | Selection | `ALLURE_KEEP_TESTPLAN` |
|------|-----------|------------------------|
| PR / push / ordinary dispatch | CI layer filters (`-DincludeTags` / npm scripts) | `false` — any TestOps testplan is stripped |
| TestOps UI rerun (`workflow_dispatch` + non-empty `ALLURE_JOB_RUN_ID`) | selective plan from TestOps | `true` — plan kept |

Launch env axes → `allure-results/environment.properties` (TestOps **Окружение** /
Report environment). Written once after each test job by `write_allure_environment` in
[`.github/actions/setup-allurectl/allurectl-run.sh`](../.github/actions/setup-allurectl/allurectl-run.sh)
(and again after artifact merge in `publish-allure-report`), from workflow `env`:

| Env | Value |
|-----|-------|
| `BROWSER` | `Chrome` |
| `OS` | `Linux` |
| `ENDPOINT` | `prod` (workflow default); stage jobs set `stage` |
| `VERSION` | `github.sha` of the run |
| `BRANCH` | `github.head_ref` or `github.ref_name` |

Look under the test/launch **Окружение** block (not Custom fields — those are Epic/Feature/Suite from code).

## Alt runners (side stacks)

| Module | Role |
|--------|------|
| `tests/javascript/tests-javascript-playwright/` | Playwright tags = layers; stand is `UI_URL` / `STAND` (**active**) |
| `tests/typescript/tests-typescript-playwright/` | Playwright tags = layers; stand is `UI_URL` / `STAND` (**active**, JS etalon typed) |
| `tests/python/tests-python-selenium/` | pytest markers = layers; stand is `STAND` / `BASE_URL` (**active**) |
| `tests/python/tests-python-selene/` | pytest + Selene + in-cell httpx; stand is `STAND` / `BASE_URL` (**active**, api+ui+e2e). Not clone default CI |
| `tests/python/tests-python-playwright/` | pytest + Playwright + in-cell APIRequest; stand is `STAND` / `BASE_URL` (**active**, api+ui+e2e). Not clone default CI |
| `tests/go/tests-go-testing-allure3-net_http/` | `go test` packages = layers; stand is `STAND` / `API_BASE_URL` (**active**, HTTP-only catalog) |
| `tests/kotlin/tests-kotlin-gradle-junit5-allure3-ktor/` | Gradle + JUnit 5 + Ktor client; stand is `-Denv` (**active**, HTTP-only catalog) |
| `tests/kotlin/tests-kotlin-gradle-junit5-allure3-selenide/` | Gradle + JUnit 5 + Selenide + in-cell Ktor; stand is `-Denv` (**active**, api+ui+e2e). Not clone default CI |
| `tests/kotlin/tests-kotlin-gradle-junit5-allure3-selenium/` | Gradle + JUnit 5 + Selenium + in-cell Ktor; stand is `-Denv` (**active**, api+ui+e2e). Not clone default CI |
| Cypress, remaining `kotlin/…` UI slots, … | slots in [`deploy/matrix.yaml`](../deploy/matrix.yaml) |

Same app under test; not separate pyramid layers — parallel teaching stacks ([NAMING.md](NAMING.md)).
Playwright takes `UI_URL`, pytest takes `BASE_URL`, Go takes `STAND` / `API_BASE_URL`, Kotlin HTTP takes `-Denv`.

## Where the commands live

[`ci.yml`](../.github/workflows/ci.yml) is the orchestrator: same job ids, `needs` / `if` /
dispatch. Each layer job is checkout plus `uses: ./backend|frontend|tests/.github/actions/<verb>`
with `module_dir` from the stack knobs (`format`). The command a
student runs locally (`./gradlew test …` / `npm test`) lives **inside the module action**,
not in the workflow.

Dispatch is per-layer booleans (`run_integration`, `run_api`, `run_mock`, `run_e2e`,
`run_screenshot`, `run_manual`) plus `update_mock_screenshots` / `update_e2e_screenshots` and `include_tags`/`exclude_tags` overrides.
To add another layer, copy `manual-tests` in `ci.yml` and the matching tests module action.

## CI cache (Gradle)

CI-only. Writers save GUH + configuration cache **inside the module action**. Readers restore GUH **read-only** from `infra-tests` (`GRADLE_BUILD_ACTION_CACHE_KEY_JOB`) and **do not** restore CC. **Do not enable CC on `api-tests` / `e2e-tests` / `api-tests-stage` / `e2e-tests-stage`** (or `ui-tests` / `manual-tests`) — CC pins absolute `GRADLE_USER_HOME` / JaCoCo paths from another runner.

| | Jobs | GUH | CC |
|--|------|-----|-----|
| Writer, backend | `backend-unit-tests`, `integration-tests`, `sonar-backend` | own `github.job` | yes (`backend/java/backend-java-spring`) |
| Writer, tests | `infra-tests`, `sonar-tests` | own `github.job` | yes (tests module) |
| Reader | `ui-tests`, `api-tests`, `e2e-tests`, `api-tests-stage`, `e2e-tests-stage`, `manual-tests` | read-only from `infra-tests` | **no** |

## Test data and secrets

- Register-flow tests (api / e2e) create `user_*` accounts and **delete them**
  through `DELETE /api/auth/me` (`AuthApiClient.deleteAccountQuietly`). They follow
  `@Tag("api")` / `@Tag("e2e")` and the stand from `-Denv`.
  The lifecycle round-trip also documents stateless logout: the JWT
  survives `logout` and dies with the account.
- `prod.properties` / `stage.properties` commit the **creds-less** hub URL. Live jobs pass both
  `SELENOID_WEBDRIVER_URL` (`/wd/hub`, Selenide/Selenium `-DremoteUrl`) and
  `SELENOID_PLAYWRIGHT_URL` (`wss://…`). The active UI library reads one of them. Mock sets
  neither. Playwright WS image tag must match `@playwright/test`.

## CD graph

Matches [`ci.yml`](../.github/workflows/ci.yml) `needs` (Sonar ×3 gates **deploy**, not build;
FE lane: `frontend-unit-tests` → `ui-tests` → `sonar-frontend`; mock also gates `build-frontend`):

```
every run (PR + main):
  backend-unit-tests → integration-tests
  backend-unit-tests + integration-tests → sonar-backend
  frontend-unit-tests → ui-tests → sonar-frontend
  infra-tests → sonar-tests (sonar-tests skipped on backend-only lane)
  ui-tests (needs frontend-unit-tests + trigger; every PR; frontend lane on main)

main (via `trigger.cd_stage` then `cd_production`):
  same builds (main|develop)
  deploy-backend-stage / deploy-frontend-stage ← STAGE_APP_DIR
  api-tests-stage ← deploy-backend-stage; full includeTags=api vs stage
  e2e-tests-stage ← api-tests-stage + deploy-frontend-stage; full e2e exclude mock,screenshot
  deploy-backend ← build-backend + sonar-backend + e2e-tests-stage
  deploy-frontend ← build-frontend + sonar-frontend + e2e-tests-stage
  api-tests ← deploy-backend (or tests-lane vs live stand); -Denv=prod -DincludeTags=api
  e2e-tests ← api-tests + deploy-frontend; -Denv=prod -DincludeTags=e2e excludeTags=screenshot
  manual-tests: dispatch (needs e2e-tests + testops)

develop (via `trigger.cd_stage` only — no prod):
  same builds (main|develop)
  deploy-backend-stage / deploy-frontend-stage ← STAGE_APP_DIR
  api-tests-stage ← deploy-backend-stage; full includeTags=api vs stage
  e2e-tests-stage ← api-tests-stage + deploy-frontend-stage; full e2e exclude mock,screenshot
```

Push/dispatch: `main` preempts `develop` (`preempt-develop-cd` cancels those runs;
`yield-to-main-cd` aborts a new develop run if main is queued or running). Latest
`develop` cancels older `develop`. A second `main` queues (`ci-cd-main`, no
cancel-in-progress). PRs stay `ci-pr-<ref>` and may cancel in progress.

`api-tests` gates on `deploy-backend` (not a join with frontend). `api-tests-stage` is the same vs `deploy-backend-stage`. `integration-tests` runs in `BACKEND_DIR` before
build/deploy and does **not** wait on deploy.
`sonar-tests` scans **infra helpers** (`-DincludeTags=infra`), not api/e2e results.
It runs after `infra-tests` on **PR** and **main**, except the backend-only lane
(`infra-backend` only — no full tests-module coverage to gate).
`build-backend` / `build-frontend` do **not** `needs` Sonar. `sonar-frontend` waits on
`ui-tests` (success or skipped — backend-only lane still scans). There is no
`build-frontend` → `ui-tests` edge (mock does not wait for the GHCR image) and no
deploy → `integration-tests` edge.
