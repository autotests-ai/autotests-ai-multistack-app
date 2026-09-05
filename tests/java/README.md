# Java tests

Pattern: see [../NAMING.md](../NAMING.md). **UI-only** slots: `tests-java-junit5-{selenide,selenium,playwright}`. Living Playwright combo: `tests-java-junit5-api_request-playwright`. Do not put `gradle` / `maven` / `allure2` / `allure3` / `no_allure` in the folder id.

Clone folder = teaching **block**. Combo (e.g. Selenium + Retrofit) = generate, not a third folder.

| Folder | Stack | Status |
|--------|--------|--------|
| `tests-java-junit5-rest_assured-selenide` | JUnit 5 · Selenide (+ Rest Assured in this default cell) | **active** |
| `tests-java-junit5-rest_assured-selenide-appium` | native e2e · Selenide + Appium | **active** |
| `tests-java-junit5-rest_assured-selenium` | UI+HTTP block · Selenium 4 + Rest Assured | **active** |
| `tests-java-junit5-api_request-playwright` | UI+HTTP block · Playwright for Java + APIRequest | **active** |
| `tests-java-junit5-selenide` | **UI-only** · JUnit 5 · Selenide (no REST) | slot |
| `tests-java-junit5-selenium` | **UI-only** · JUnit 5 · Selenium (no REST) | slot |
| `tests-java-junit5-playwright` | **UI-only** · JUnit 5 · Playwright (no REST) | slot |
| `tests-java-junit5-rest_assured` | HTTP block · Rest Assured | **active** |
| `tests-java-junit5-retrofit2` | HTTP block · Retrofit 2 | **active** |
| `tests-java-junit4-selenium` | JUnit 4 · Selenium | slot |
| `tests-java-testng-selenium` | TestNG · Selenium | slot |
| `tests-java-jmeter` | Apache JMeter (JMX) | **active etalon** — `layers: [performance]` |
| `tests-java-gatling` | Gatling Java DSL | **active** sibling — `layers: [performance]` |

```bash
cd tests/java/tests-java-junit5-rest_assured-selenide
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot

cd tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew emulator
./gradlew assembleApp emulator -Denv=ci
./gradlew selenoid -Denv=prod

cd tests/java/tests-java-junit5-rest_assured-selenium
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot

cd tests/java/tests-java-junit5-rest_assured
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api

cd tests/java/tests-java-junit5-retrofit2
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api

cd tests/java/tests-java-junit5-api_request-playwright
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=ci -DincludeTags=e2e
```
