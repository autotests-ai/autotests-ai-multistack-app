# Tests

Automation outside backend unit / frontend RTL — by **language** → **stack dimensions**.

Clone folder = **teaching block** (UI school, HTTP client, runner/build variant, or load). Client combo (Selenium+Retrofit) = generate, not a cartesian extra folder. **UI-only** slots (no REST) use short ids — see [NAMING.md](NAMING.md).

| Doc | Role |
|-----|------|
| **[LAYERS.md](LAYERS.md)** | Pyramid layers → paths → Gradle/npm → CI jobs |
| **[NAMING.md](NAMING.md)** | Module folder pattern (no `gradle` / `maven` / `allure2` / `allure3` / `no_allure` in the id) |

```
tests/
  java/
    tests-java-junit5-rest_assured-selenide/     # active — default cell (Selenide + Rest Assured)
    tests-java-junit5-rest_assured-selenium/       # active — UI+HTTP Selenium 4 + Rest Assured
    tests-java-junit5-api_request-playwright/     # active — UI+HTTP Playwright for Java + APIRequest
    tests-java-junit5-selenide/                      # slot — UI-only Selenide (no REST)
    tests-java-junit5-selenium/                      # slot — UI-only Selenium (no REST)
    tests-java-junit5-playwright/                    # slot — UI-only Playwright (no REST)
    tests-java-junit5-rest_assured/   # active — HTTP block Rest Assured
    tests-java-junit5-retrofit2/    # active — HTTP block Retrofit 2
    tests-java-junit4-selenium/        # slot — JUnit 4
    tests-java-testng-selenium/       # slot — TestNG
    tests-java-jmeter/                               # slot — JMeter JMX
    tests-java-gatling/                       # slot — Gatling Java DSL
  csharp/
    tests-csharp-nunit-restsharp-selenium/              # active — UI+HTTP Selenium + in-cell RestSharp
    tests-csharp-nunit-selenium/                      # slot — UI-only Selenium (no REST)
    tests-csharp-nunit-restsharp/             # active — HTTP block RestSharp (31 api + 9 ConfigReader + 3 manual)
    tests-csharp-xunit-api_request-playwright/           # active — UI+HTTP Playwright + in-cell APIRequest
    tests-csharp-xunit-playwright/                   # slot — UI-only Playwright (no REST)
  groovy/
    tests-groovy-jmeter/                             # slot — JMeter JSR223
  kotlin/
    tests-kotlin-junit5-ktor-selenide/     # active — UI+HTTP Selenide + in-cell Ktor
    tests-kotlin-junit5-ktor-selenium/    # active — UI+HTTP Selenium + in-cell Ktor
    tests-kotlin-junit5-api_request-playwright/   # active — UI+HTTP Playwright + in-cell APIRequest
    tests-kotlin-junit5-selenide/                    # slot — UI-only Selenide (no REST)
    tests-kotlin-junit5-selenium/                    # slot — UI-only Selenium (no REST)
    tests-kotlin-junit5-playwright/                  # slot — UI-only Playwright (no REST)
    tests-kotlin-junit5-ktor/         # active — HTTP block Ktor
    tests-kotlin-gatling/                     # slot — Gatling Kotlin DSL
  scala/
    tests-scala-gatling/                             # slot — Gatling Scala DSL
  javascript/
    tests-javascript-api_request-playwright/         # active — UI+HTTP, APIRequest in-cell; c8 + sonar
    tests-javascript-playwright/                     # active — UI-only Playwright (no REST)
    tests-javascript-axios-playwright/               # bad-practice — Axios + Playwright (do not fill)
    tests-javascript-cypress/                       # slot — UI block
    tests-javascript-axios/                         # active — HTTP-only Axios (Vitest; not PW client)
    tests-javascript-k6/                             # slot — k6 JavaScript
    tests-javascript-gatling/                       # slot — Gatling JS SDK
  python/
    tests-python-pytest-requests-selenium/                   # active — UI+HTTP Selenium + in-cell requests
    tests-python-pytest-requests-selene/                     # active — UI+HTTP Selene + in-cell requests
    tests-python-pytest-api_request-playwright/              # active — UI+HTTP Playwright + APIRequest
    tests-python-pytest-selenium/                            # slot — UI-only Selenium (no REST)
    tests-python-pytest-selene/                             # slot — UI-only Selene (no REST)
    tests-python-pytest-playwright/                          # slot — UI-only Playwright (no REST)
    tests-python-pytest-requests/                            # active — HTTP block requests (31 api + 9 ConfigReader + 3 manual)
    tests-python-pytest-httpx/                               # active — HTTP block httpx
    tests-python-yandex_tank/                         # slot — Yandex.Tank
    tests-python-locust/                             # slot — Locust
  typescript/
    tests-typescript-api_request-playwright/         # active — UI+HTTP, APIRequest in-cell; c8 + sonar
    tests-typescript-playwright/                     # slot — UI-only Playwright (no REST)
    tests-typescript-axios/                          # active — HTTP block axios (Vitest)
    tests-typescript-k6/                             # slot — k6 TypeScript
    tests-typescript-gatling/                       # slot — Gatling TS SDK
  go/
    tests-go-testing-net_http/                         # active — HTTP block (31 api + 9 ConfigReader + 3 manual)
    tests-go-testing-api_request-playwright/             # active — UI+HTTP Playwright + in-cell APIRequest
    tests-go-testing-playwright/                     # slot — UI-only Playwright (no REST)
    tests-go-cdp/                                    # mill IR (greedy run)
  rust/
    tests-rust-testing-reqwest/                      # active — HTTP block reqwest
    tests-rust-testing-selenium/                     # active — UI-only Selenium / thirtyfour
    tests-rust-testing-reqwest-selenium/              # active — UI+HTTP reqwest + Selenium
  _deferred/
```

| Kind | Job id | Where |
|------|--------|-------|
| Product unit | `backend-unit-tests` | `backend/java/backend-java-spring/src/test/` |
| Infra | `infra-tests` | `…/tests/infra/` · `@Tag("infra")`; backend-only lane → `infra-backend` (`ConfigReader`) |
| RTL | `frontend-unit-tests` | `frontend/typescript/frontend-typescript-react/src/test/` |
| integration / api / ui / e2e / manual | `integration-tests` · `api-tests` / `api-tests-stage` · `ui-tests` · `e2e-tests` / `e2e-tests-stage` / `manual-tests` | `backend/java/…/integration/` · `tests/api/` · `tests/ui/` · `tests/e2e/` · manual stubs **in code** (`tests/manual/`) |

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

The Java canon module has one Gradle task — `test`. The layer is a tag filter, the stand is `-Denv`:

```bash
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=infra-backend jacocoTestCoverageVerification
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
./gradlew test -Denv=mock -DincludeTags=screenshot
./gradlew test -Denv=stage -DincludeTags=e2e -DexcludeTags=screenshot
./gradlew test -Denv=prod -DincludeTags=e2e -DexcludeTags=screenshot
```

Screenshot tests are two Selenide stages (`screenshots/{mock|e2e}/{os}/{chrome-148}/…`), not a pyramid layer — see [LAYERS.md](LAYERS.md).
