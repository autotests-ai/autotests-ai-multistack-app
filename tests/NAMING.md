# Test module naming (SSOT)

Folder name = stacked dimensions, **`-` between segments**, **`_` only in compound tokens** (`no_allure`, `react_testing_library`).

## Pattern

```
tests-{language}-{build}-{framework}-{reporting}-{automation}
```

| Segment | Examples | Notes |
|---------|----------|-------|
| `language` | `java`, `kotlin`, `scala`, `groovy`, `javascript`, `typescript`, `python`, `go`, `csharp` | top-level under `tests/` |
| `build` | `gradle`, `maven`, `npm`, `pip`, `mod` | omit when obvious (e.g. JS → npm) |
| `framework` | `junit4`, `junit5`, `junit6`, `testng`, `pytest`, `vitest`, `testing`, `nunit`, `xunit` | test runner |
| `reporting` | `allure2`, `allure3`, `no_allure` | underscore in `no_allure` |
| `automation` | `selenium`, `selenide`, `selene`, `playwright`, `cypress`, `restassured`, `retrofit2`, `requests`, `httpx`, `axios`, `ktor`, `restsharp`, `jmeter`, `gatling`, `k6`, `yandex-tank`, `locust`, `none` | UI/HTTP school or load tool; `none` for api-only when unnamed |

## Java (Gradle) — matrix

| Folder | Status |
|--------|--------|
| `tests-java-gradle-junit5-allure3-selenide` | **active** — block 2 CI target |
| `tests-java-gradle-junit5-allure3-selenium` | **active** — UI+HTTP block Selenium 4 + Rest Assured |
| `tests-java-gradle-junit5-allure3-playwright` | **active** — UI+HTTP Playwright for Java + Rest Assured |
| `tests-java-gradle-junit5-allure3-restassured` | **active** — HTTP block Rest Assured |
| `tests-java-gradle-junit5-allure3-retrofit2` | **active** — HTTP block Retrofit 2 |
| `tests-java-gradle-junit5-allure2-selenide` | slot |
| `tests-java-gradle-junit5-no_allure-selenide` | slot |
| `tests-java-gradle-junit4-allure2-selenium` | slot |
| `tests-java-gradle-testng-allure3-selenium` | slot |
| `tests-java-maven-junit5-allure3-selenide` | slot |
| `tests-java-jmeter` | slot — JMeter JMX, `layers: [performance]` |
| `tests-java-gradle-gatling` | slot — Gatling Java DSL, `layers: [performance]` |

Only one module is the CI default (Selenide). Selenium living block has api+ui+e2e; Rest Assured and Retrofit 2 are living HTTP-only (`layers: [api]`). Java Playwright is living UI+HTTP (`layers: [api, ui, e2e]`, Rest Assured for HTTP — same as Selenide/Selenium). Other folders are teaching slots / generator outputs.

## JavaScript / TypeScript / Python / Go / Kotlin / C#

Living folders may shorten when dimensions are obvious (`tests-javascript-playwright`).
Full IDs live in hub [`matrix.yaml`](../../matrix.yaml) `tests.modules` (`status: active|slot`).

| Folder / id | Status |
|-------------|--------|
| `tests-javascript-playwright` | **active** |
| `tests-javascript-cypress` | slot — UI block |
| `tests-javascript-axios` | slot — HTTP-only Axios (not in-cell Playwright) |
| `tests-javascript-k6` | slot — k6 JavaScript, `layers: [performance]` |
| `tests-javascript-gatling` | slot — Gatling JS SDK, `layers: [performance]` |
| `tests-typescript-playwright` | **active** |
| `tests-typescript-axios` | **active** — HTTP-only Axios (Vitest; not in-cell Playwright) |
| `tests-typescript-k6` | slot — k6 TypeScript, `layers: [performance]` |
| `tests-typescript-gatling` | slot — Gatling TS SDK, `layers: [performance]` |
| `tests-python-selenium` | **active** |
| `tests-python-selene` | slot — UI block Selene |
| `tests-python-playwright` | slot — UI block |
| `tests-python-requests` | slot — HTTP block requests |
| `tests-python-httpx` | **active** — HTTP block httpx |
| `tests-python-yandex-tank` | slot — Yandex.Tank, `layers: [performance]` |
| `tests-python-locust` | slot — Locust, `layers: [performance]` |
| `tests-kotlin-gradle-junit5-allure3-selenide` | slot — UI block |
| `tests-kotlin-gradle-junit5-allure3-selenium` | slot — UI block |
| `tests-kotlin-gradle-junit5-allure3-playwright` | slot — UI block |
| `tests-kotlin-gradle-junit5-allure3-ktor` | slot — HTTP block Ktor client |
| `tests-kotlin-gradle-gatling` | slot — Gatling Kotlin DSL |
| `tests-scala-gatling` | slot — Gatling Scala DSL |
| `tests-groovy-jmeter` | slot — JMeter JSR223 Groovy |
| `tests-go-testing-allure3` | **active** — HTTP block (Allure Go + testify) |
| `tests-go-testing-allure3-playwright` | slot — UI block Playwright |
| `tests-go-cdp` | mill — IR / `greedy run`, not a Selenide peer |
| `tests-csharp-nunit-allure3-selenium` | slot — UI block |
| `tests-csharp-nunit-allure3-restsharp` | slot — HTTP block RestSharp |
| `tests-csharp-xunit-allure3-playwright` | slot — UI block |

```
tests-javascript-npm-playwright-no_allure
tests-javascript-npm-jest-no_allure
tests-typescript-npm-playwright-allure3
tests-python-pip-pytest-allure3-selenium
tests-python-pip-pytest-no_allure-playwright
tests-go-mod-testing-allure3
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

Java Playwright living (`tests-java-gradle-junit5-allure3-playwright`) covers the same functional UI stems as TypeScript Playwright, including `header-active-nav`, plus the same `tests/api/` stems as the Java HTTP cells. Screenshot PNG compare is **not in this school yet** (Playwright Chromium baselines ≠ CFT Chrome SSOT). Burger/header-screenshot stay Java Selenide/Selenium-only, as in the table.

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
| RTL (JS React) | `frontend/javascript/frontend-javascript-react/src/test/` | Vitest + RTL (slot) |
| Angular (slot) | `frontend/<lang>/frontend-*-angular/` (+ `src/test/`) | component tests TBD |
| Vue (slot) | `frontend/<lang>/frontend-*-vue/` (+ `src/test/`) | component tests TBD |
| Product UI | `frontend/<lang>/frontend-*` | served under `/{frontend}/` |

Paths SSOT: `backend/scripts/paths.sh` · layout: [frontend/README.md](../frontend/README.md)
