# Java tests

Pattern: `tests-java-{build}-{framework}-{reporting}-{automation}` — see [../NAMING.md](../NAMING.md).

Clone folder = teaching **block**. Combo (e.g. Selenium + Retrofit) = generate, not a third folder.

| Folder | Stack | Status |
|--------|--------|--------|
| `tests-java-gradle-junit5-allure3-selenide` | Gradle · JUnit 5 · Allure 3 · Selenide (+ Rest Assured in this default cell) | **active** |
| `tests-java-gradle-junit5-allure3-selenium` | UI+HTTP block · Selenium 4 + Rest Assured | **active** |
| `tests-java-gradle-junit5-allure3-playwright` | UI+HTTP block · Playwright for Java + Rest Assured | **active** |
| `tests-java-gradle-junit5-allure3-restassured` | HTTP block · Rest Assured | **active** |
| `tests-java-gradle-junit5-allure3-retrofit2` | HTTP block · Retrofit 2 | **active** |
| `tests-java-gradle-junit5-allure2-selenide` | Gradle · JUnit 5 · Allure 2 · Selenide | slot |
| `tests-java-gradle-junit5-no_allure-selenide` | Gradle · JUnit 5 · no Allure · Selenide | slot |
| `tests-java-gradle-junit4-allure2-selenium` | Gradle · JUnit 4 · Allure 2 · Selenium | slot |
| `tests-java-gradle-testng-allure3-selenium` | Gradle · TestNG · Allure 3 · Selenium | slot |
| `tests-java-maven-junit5-allure3-selenide` | Maven · JUnit 5 · Allure 3 · Selenide | slot |
| `tests-java-jmeter` | Apache JMeter (JMX) | slot — `layers: [performance]` |
| `tests-java-gradle-gatling` | Gradle · Gatling Java DSL | slot — `layers: [performance]` |

```bash
cd tests/java/tests-java-gradle-junit5-allure3-selenide
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot

cd tests/java/tests-java-gradle-junit5-allure3-selenium
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot

cd tests/java/tests-java-gradle-junit5-allure3-restassured
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=api

cd tests/java/tests-java-gradle-junit5-allure3-retrofit2
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=api

cd tests/java/tests-java-gradle-junit5-allure3-playwright
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=ci -DincludeTags=e2e
```
