# Test module naming (SSOT)

Folder name = stacked dimensions, **`-` between segments**, **`_` only in compound tokens** (`rest_assured`, `api_request`, `net_http`, `react_testing_library`).

## Pattern

```
tests-{language}-{framework}-{automation}
```

Do **not** put `gradle`, `maven`, `allure2`, `allure3`, or `no_allure` in the folder id **or** the profile id. Default JVM build is Gradle. Allure is a library / CI knob, not a path segment. Profile id = module id without the `tests-` prefix (`java-junit5-rest_assured-selenide` ↔ `tests-java-junit5-rest_assured-selenide`).

| Segment | Examples | Notes |
|---------|----------|-------|
| `language` | `java`, `kotlin`, `scala`, `groovy`, `javascript`, `typescript`, `python`, `go`, `csharp`, `rust` | top-level under `tests/` |
| `framework` | `junit4`, `junit5`, `junit6`, `testng`, `pytest`, `vitest`, `testing`, `nunit`, `xunit` | test runner |
| `automation` | `selenium`, `selenide`, `selene`, `playwright`, `cypress`, `rest_assured`, `retrofit2`, `requests`, `httpx`, `axios`, `ktor`, `restsharp`, `net_http`, `reqwest`, `api_request`, `jmeter`, `gatling`, `k6`, `yandex_tank`, `locust`, `none` | UI/HTTP school or load tool; `api_request` = Playwright `APIRequest` in combo ids; `_` in compounds (`rest_assured`, `yandex_tank`); `none` for api-only when unnamed |

## Java — matrix

| Folder | Status |
|--------|--------|
| `tests-java-junit5-rest_assured-selenide` | **active** — block 2 CI target |
| `tests-java-junit5-rest_assured-selenium` | **active** — UI+HTTP block Selenium 4 + Rest Assured |
| `tests-java-junit5-api_request-playwright` | **active** — UI+HTTP Playwright for Java + APIRequest |
| `tests-java-junit5-rest_assured` | **active** — HTTP block Rest Assured |
| `tests-java-junit5-retrofit2` | **active** — HTTP block Retrofit 2 |
| `tests-java-junit5-selenide` | slot — **UI-only** Selenide (no REST) |
| `tests-java-junit5-selenium` | slot — **UI-only** Selenium (no REST) |
| `tests-java-junit5-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-java-junit4-selenium` | slot — JUnit 4 |
| `tests-java-testng-selenium` | slot — TestNG |
| `tests-java-jmeter` | **active** — JMeter JMX etalon, `layers: [performance]` |
| `tests-java-gatling` | **active** — Gatling Java DSL sibling, `layers: [performance]` |

Only one module is the CI default (Selenide). Selenium living block has api+ui+e2e; Rest Assured and Retrofit 2 are living HTTP-only (`layers: [api]`). Java Playwright is living UI+HTTP (`layers: [api, ui, e2e]`, Playwright `APIRequest` for HTTP). **UI-only slots** (no REST): `tests-java-junit5-{selenide,selenium,playwright}` (`layers: [ui, e2e]`). Other folders are teaching slots / generator outputs.

## UI-only vs combo vs HTTP-only

One clone folder = one teaching block. Students who are not on REST yet get a **UI-only** slot (`layers: [ui, e2e]`, no HTTP client). Combo living cells stay as they are (in-cell HTTP). HTTP-only siblings stay separate.

Target folder grammar:

```
tests-{language}-{framework}-{automation}              # UI-only
tests-{language}-{framework}-{http-client}-{automation}  # combo (HTTP first, then UI)
tests-{language}-{framework}-{http-client}             # HTTP-only
tests-{language}-{tool}                               # jmeter, gatling
```

| Kind | Example folder | Layers |
|------|----------------|--------|
| UI-only slot | `tests-java-junit5-selenide` | `ui`, `e2e` |
| Combo living (current) | `tests-java-junit5-rest_assured-selenide` | `api`, `ui`, `e2e` |
| HTTP-only living | `tests-java-junit5-rest_assured` | `api` |

JS/TS Playwright combo living is `tests-{javascript,typescript}-api_request-playwright` (native **APIRequest**). Python Playwright combo is `tests-python-pytest-api_request-playwright`. Java/Kotlin/C#/Go living PW folders use the same id tail `api_request-playwright` and the same in-cell HTTP (**APIRequest**). Short `tests-javascript-playwright` is living **UI-only**. Other short `tests-*-playwright` (Python: `tests-python-pytest-playwright`) stay the **UI-only** slot. JS Axios+Playwright is `tests-javascript-axios-playwright` (**bad-practice**, do not fill). There is no HTTP-only `tests-*-api_request` school. Cypress remains an empty JS UI school.

Python Selenium/Selene combos use **requests** in-cell (`tests-python-pytest-requests-selenium`, `tests-python-pytest-requests-selene`). Python Playwright combo uses **APIRequest** (`tests-python-pytest-api_request-playwright`), same tail as JS/TS. httpx stays HTTP-only (`tests-python-pytest-httpx`), not a UI in-cell client.

Short profile id without an HTTP client **is** UI-only (`csharp-nunit-selenium`, `go-testing-playwright`, `javascript-playwright`, `typescript-playwright`, `python-pytest-selene`). Combo living keeps HTTP-then-UI in the profile (`csharp-nunit-restsharp-selenium`, `go-testing-api_request-playwright`, `javascript-api_request-playwright`, `typescript-api_request-playwright`, `python-pytest-requests-selene`, `python-pytest-api_request-playwright`). JS `javascript-playwright` is living UI-only; other short Playwright ids stay slots.

## JavaScript / TypeScript / Python / Go / Kotlin / C# / Rust

JS/TS living folders may shorten when the runner is obvious (`tests-javascript-axios`). Python always keeps `pytest` in the folder and profile id — HTTP-only, combo, and UI-only (`tests-python-pytest-httpx`, `tests-python-pytest-requests-selenium`, `tests-python-pytest-selene`). Load tools stay without pytest (`tests-python-locust`, `tests-python-yandex_tank`).
Full IDs live in hub [`matrix.yaml`](../../matrix.yaml) `tests.modules` (`status: active|slot`).

| Folder / id | Status |
|-------------|--------|
| `tests-javascript-api_request-playwright` | **active** — UI+HTTP Playwright (`APIRequest` in-cell); c8 + sonar |
| `tests-javascript-playwright` | **active** — **UI-only** Playwright (no REST) |
| `tests-javascript-axios-playwright` | **bad-practice** — Axios + Playwright; do not fill (living combo stays APIRequest) |
| `tests-javascript-cypress` | slot — UI block |
| `tests-javascript-axios` | **active** — HTTP-only Axios (Vitest; not in-cell Playwright) |
| `tests-javascript-k6` | slot — k6 JavaScript, `layers: [performance]` |
| `tests-javascript-gatling` | slot — Gatling JS SDK, `layers: [performance]` |
| `tests-typescript-api_request-playwright` | **active** — UI+HTTP Playwright (`APIRequest` in-cell); c8 + sonar |
| `tests-typescript-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-typescript-axios` | **active** — HTTP-only Axios (Vitest; not in-cell Playwright) |
| `tests-typescript-k6` | slot — k6 TypeScript, `layers: [performance]` |
| `tests-typescript-gatling` | slot — Gatling TS SDK, `layers: [performance]` |
| `tests-python-pytest-requests-selenium` | **active** — UI+HTTP Selenium + in-cell requests |
| `tests-python-pytest-requests-selene` | **active** — UI+HTTP Selene + in-cell requests |
| `tests-python-pytest-api_request-playwright` | **active** — UI+HTTP Playwright (`APIRequest` in-cell) |
| `tests-python-pytest-selenium` | slot — **UI-only** Selenium (no REST) |
| `tests-python-pytest-selene` | slot — **UI-only** Selene (no REST) |
| `tests-python-pytest-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-python-pytest-requests` | **active** — HTTP block requests (31 api + 9 ConfigReader) |
| `tests-python-pytest-httpx` | **active** — HTTP block httpx (HTTP-only; not a UI in-cell client) |
| `tests-python-yandex_tank` | slot — Yandex.Tank, `layers: [performance]` |
| `tests-python-locust` | slot — Locust, `layers: [performance]` |
| `tests-kotlin-junit5-ktor-selenide` | **active** — UI+HTTP Selenide + in-cell Ktor |
| `tests-kotlin-junit5-ktor-selenium` | **active** — UI+HTTP Selenium + in-cell Ktor |
| `tests-kotlin-junit5-api_request-playwright` | **active** — UI+HTTP Playwright + in-cell APIRequest |
| `tests-kotlin-junit5-selenide` | slot — **UI-only** Selenide (no REST) |
| `tests-kotlin-junit5-selenium` | slot — **UI-only** Selenium (no REST) |
| `tests-kotlin-junit5-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-kotlin-junit5-ktor` | **active** — HTTP block Ktor client |
| `tests-kotlin-gatling` | slot — Gatling Kotlin DSL |
| `tests-scala-gatling` | slot — Gatling Scala DSL |
| `tests-groovy-jmeter` | slot — JMeter JSR223 Groovy |
| `tests-go-testing-net_http` | **active** — HTTP block (`net/http` + Allure Go + testify) |
| `tests-go-testing-api_request-playwright` | **active** — UI+HTTP Playwright + in-cell APIRequest |
| `tests-go-testing-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-go-cdp` | mill — IR / `greedy run`, not a Selenide peer |
| `tests-csharp-nunit-restsharp-selenium` | **active** — UI+HTTP Selenium + in-cell RestSharp |
| `tests-csharp-nunit-selenium` | slot — **UI-only** NUnit · Selenium (no REST) |
| `tests-csharp-nunit-restsharp` | **active** — HTTP block RestSharp |
| `tests-csharp-xunit-api_request-playwright` | **active** — UI+HTTP xUnit · Playwright + in-cell APIRequest |
| `tests-csharp-xunit-playwright` | slot — **UI-only** xUnit · Playwright (no REST) |
| `tests-rust-testing-reqwest` | **active** — HTTP block reqwest |
| `tests-rust-testing-selenium` | **active** — **UI-only** `cargo test` · Selenium / thirtyfour (no REST catalog) |
| `tests-rust-testing-reqwest-selenium` | **active** — UI+HTTP reqwest + Selenium |

```
tests-javascript-api_request-playwright
tests-python-pytest-requests-selenium
tests-go-testing-net_http
tests-java-junit4-selenium
```

## Suite file stems (cross-language)

One **stem** per Java class. Suffixes stay idiomatic — do not copy `LoginTests.java` into Playwright or pytest.

| Stem | Java | Playwright (`*.spec.ts` / `*.spec.js`) | pytest |
|------|------|----------------------------------------|--------|
| `login` | `LoginTests.java` | `login.spec.ts` | `test_login.py` |
| `register` | `RegisterTests.java` | `register.spec.ts` | `test_register.py` |
| `logout` | `LogoutTests.java` | `logout.spec.ts` | `test_logout.py` |
| `home` | `HomeTests.java` | `home.spec.ts` | `test_home.py` |
| `session` | `SessionTests.java` | `session.spec.ts` | `test_session.py` |
| `delete-account` | `DeleteAccountTests.java` | `delete-account.spec.ts` | `test_delete_account.py` |
| `home-error-state` | `HomeErrorStateTests.java` | `home-error-state.spec.ts` | `test_home_error_state.py` |
| `home-layout` | `HomeLayoutTests.java` | `home-layout.spec.ts` | `test_home_layout.py` |
| `login-form` | `LoginFormTests.java` | `login-form.spec.ts` | `test_login_form.py` |
| `login-embed` | `LoginEmbedTests.java` | `login-embed.spec.ts` | `test_login_embed.py` |
| `register-form` | `RegisterFormTests.java` | `register-form.spec.ts` | `test_register_form.py` |
| `login-screenshot` | `LoginScreenshotTests.java` | `login-screenshot.spec.ts` | `test_login_screenshot.py` |
| `home-layout-screenshot` | `HomeLayoutScreenshotTests.java` | `home-layout-screenshot.spec.ts` | `test_home_layout_screenshot.py` |
| `welcome-panel-screenshot` | `WelcomePanelScreenshotTests.java` | `welcome-panel-screenshot.spec.ts` | `test_welcome_panel_screenshot.py` |
| `header` | `HeaderTests.java` | — | — |
| `burger-menu` | `BurgerMenuTests.java` | — | — |
| `header-screenshot` | `HeaderScreenshotTests.java` | — | — |
| `burger-menu-screenshot` | `BurgerMenuScreenshotTests.java` | — | — |
| `header-active-nav` | `HeaderActiveNavTests.java` | `header-active-nav.spec.ts` | `test_header_active_nav.py` |

API lives under `tests/api/` in every language. Playwright names the **file** after the stem (`auth.spec.ts`); pytest repeats `_api` (`test_auth_api.py`) because pytest discovery is file-based. Same stems as Java: `AuthApiTests`, `AuthRoundTripApiTests`, `BackendWiringApiTests`, `HealthItemsApiTests`, `SeedDataApiTests`.

`test.describe('Login')` / `@allure.title("Login")` / `@DisplayName("Login")` share the Java display name. Tags stay language-native (`@Tag("e2e")` · `@e2e` · `pytest.mark.e2e`).

Java Playwright living (`tests-java-junit5-api_request-playwright`) covers the same functional UI stems as TypeScript Playwright, including `header-active-nav`, plus the same `tests/api/` stems as the Java HTTP cells, with Playwright `APIRequest` for HTTP. Screenshot PNG compare is **not in this school yet** (Playwright Chromium baselines ≠ CFT Chrome SSOT). Burger/header-screenshot stay Java Selenide/Selenium-only, as in the table.

### Page objects — keep stack convention

Same locators and roles; **filenames and method style follow the stack**, not Java.

| Stack | Files | Typical methods |
|-------|-------|-----------------|
| Java / Selenide | `HomePage.java`, `LoginPage.java`, `RegisterPage.java` | `openPage()`, fluent `should…` |
| Playwright | `home.page.ts`, `login.page.ts`, `register.page.ts`, `header.page.ts` | `open()`, locators as fields |
| Python / Selenium | `home_page.py`, `login_page.py`, `register_page.py`, `header_component.py` | `open_page()`, snake_case fluent |

Do **not** rename Playwright files to `HomePage.ts` (not Playwright canon). Do **not** rename Python to PascalCase files (not PEP8). Java stays PascalCase classes.

Playwright groups pages behind a facade (`App` / `webApp`) — common in Playwright teaching; Java/Python inject page objects via the test base / fixtures instead.

## Related zones

| Kind | Path | Not in `tests/` |
|------|------|----------------|
| Backend unit | `backend/java/backend-java-spring/src/test/` | JaCoCo gate |
| RTL (TS React) | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest + RTL |
| RTL (JS React) | `frontend/javascript/frontend-javascript-react/src/test/` | Vitest + RTL (living) |
| Angular | `frontend/<lang>/frontend-*-angular/` (+ `src/test/`) | living SPA · component tests |
| Vue | `frontend/<lang>/frontend-*-vue/` (+ `src/test/`) | living SPA · component tests |
| Product UI | `frontend/<lang>/frontend-*` | served under `/{frontend}/` |

Paths SSOT: `backend/scripts/paths.sh` · layout: [frontend/README.md](../frontend/README.md)
