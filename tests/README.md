# Tests

Automation outside backend unit / frontend RTL — by **language** → **stack dimensions**.

Clone folder = **teaching block** (UI school, HTTP client, runner/build variant, or load). Client combo (Selenium+Retrofit) = generate, not a cartesian extra folder.

| Doc | Role |
|-----|------|
| **[LAYERS.md](LAYERS.md)** | Pyramid layers → paths → Gradle/npm → CI jobs |
| **[NAMING.md](NAMING.md)** | Module folder pattern `tests-{lang}-{build}-{framework}-{reporting}-{automation}` |

```
tests/
  java/
    tests-java-gradle-junit5-allure3-selenide/     # active — default cell (Selenide + Rest Assured)
    tests-java-gradle-junit5-allure3-selenium/       # active — UI+HTTP Selenium 4 + Rest Assured
    tests-java-gradle-junit5-allure3-playwright/     # active — UI+HTTP Playwright for Java + Rest Assured
    tests-java-gradle-junit5-allure3-restassured/   # active — HTTP block Rest Assured
    tests-java-gradle-junit5-allure3-retrofit2/    # active — HTTP block Retrofit 2
    tests-java-gradle-junit5-allure2-selenide/       # slot — Allure 2
    tests-java-gradle-junit5-no_allure-selenide/    # slot — no Allure
    tests-java-gradle-junit4-allure2-selenium/        # slot — JUnit 4
    tests-java-gradle-testng-allure3-selenium/       # slot — TestNG
    tests-java-maven-junit5-allure3-selenide/       # slot — Maven
    tests-java-jmeter/                               # slot — JMeter JMX
    tests-java-gradle-gatling/                       # slot — Gatling Java DSL
  csharp/
    tests-csharp-nunit-allure3-selenium/              # slot — UI block
    tests-csharp-nunit-allure3-restsharp/             # slot — HTTP block RestSharp
    tests-csharp-xunit-allure3-playwright/           # slot — UI block
  groovy/
    tests-groovy-jmeter/                             # slot — JMeter JSR223
  kotlin/
    tests-kotlin-gradle-junit5-allure3-selenide/     # slot — UI block
    tests-kotlin-gradle-junit5-allure3-selenium/    # slot — UI block
    tests-kotlin-gradle-junit5-allure3-playwright/   # slot — UI block
    tests-kotlin-gradle-junit5-allure3-ktor/         # active — HTTP block Ktor
    tests-kotlin-gradle-gatling/                     # slot — Gatling Kotlin DSL
  scala/
    tests-scala-gatling/                             # slot — Gatling Scala DSL
  javascript/
    tests-javascript-playwright/                     # active — UI+HTTP, APIRequest in-cell
    tests-javascript-cypress/                       # slot — UI block
    tests-javascript-axios/                         # slot — HTTP-only Axios (not PW client)
    tests-javascript-k6/                             # slot — k6 JavaScript
    tests-javascript-gatling/                       # slot — Gatling JS SDK
  python/
    tests-python-selenium/                            # active
    tests-python-selene/                             # slot — UI block
    tests-python-playwright/                          # slot — UI block
    tests-python-requests/                            # slot — HTTP block requests
    tests-python-httpx/                               # active — HTTP block httpx
    tests-python-yandex-tank/                         # slot — Yandex.Tank
    tests-python-locust/                             # slot — Locust
  typescript/
    tests-typescript-playwright/                     # active — UI+HTTP, APIRequest in-cell
    tests-typescript-axios/                          # active — HTTP block axios (Vitest)
    tests-typescript-k6/                             # slot — k6 TypeScript
    tests-typescript-gatling/                       # slot — Gatling TS SDK
  go/
    tests-go-testing-allure3-net_http/                         # active — HTTP block (31 api + 9 ConfigReader + 3 manual)
    tests-go-testing-allure3-playwright/             # slot — UI block
    tests-go-cdp/                                    # mill IR (greedy run)
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
