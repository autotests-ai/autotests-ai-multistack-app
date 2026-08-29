# Java tests

Pattern: `tests-java-{build}-{framework}-{reporting}-{automation}` — see [../NAMING.md](../NAMING.md).

| Folder | Stack | Status |
|--------|-------|--------|
| `tests-java-gradle-junit5-allure3-selenide` | Gradle · JUnit 5 · Allure 3 · Selenide | **active** |
| `tests-java-gradle-junit5-allure3-selenium` | Gradle · JUnit 5 · Allure 3 · Selenium 4 | planned |
| `tests-java-gradle-junit5-allure2-selenide` | Gradle · JUnit 5 · Allure 2 · Selenide | planned |
| `tests-java-gradle-junit5-no_allure-selenide` | Gradle · JUnit 5 · no Allure · Selenide | planned |
| `tests-java-gradle-junit4-allure2-selenium` | Gradle · JUnit 4 · Allure 2 · Selenium | planned |
| `tests-java-gradle-testng-allure3-selenium` | Gradle · TestNG · Allure 3 · Selenium | planned |
| `tests-java-maven-junit5-allure3-selenide` | Maven · JUnit 5 · Allure 3 · Selenide | planned |
| `tests-java-jmeter` | Apache JMeter | slot — `layers: [performance]` |
| `tests-java-gradle-gatling` | Gradle · Gatling | slot — `layers: [performance]` |

```bash
cd tests/java/tests-java-gradle-junit5-allure3-selenide
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot
```
