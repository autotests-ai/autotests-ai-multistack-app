# Java tests

Pattern: `tests_java_{build}_{framework}_{reporting}_{automation}` — see [../NAMING.md](../NAMING.md).

| Folder | Stack | Status |
|--------|-------|--------|
| `tests_java_gradle_junit5_allure3_selenide` | Gradle · JUnit 5 · Allure 3 · Selenide | **active** |
| `tests_java_gradle_junit5_allure3_selenium` | Gradle · JUnit 5 · Allure 3 · Selenium 4 | planned |
| `tests_java_gradle_junit5_allure2_selenide` | Gradle · JUnit 5 · Allure 2 · Selenide | planned |
| `tests_java_gradle_junit5_no-allure_selenide` | Gradle · JUnit 5 · no Allure · Selenide | planned |
| `tests_java_gradle_junit4_allure2_selenium` | Gradle · JUnit 4 · Allure 2 · Selenium | planned |
| `tests_java_gradle_testng_allure3_selenium` | Gradle · TestNG · Allure 3 · Selenium | planned |
| `tests_java_maven_junit5_allure3_selenide` | Maven · JUnit 5 · Allure 3 · Selenide | planned |

```bash
cd tests/java/tests_java_gradle_junit5_allure3_selenide
./gradlew testUnit -DpyramidStand=reference_ci
./gradlew testE2e -Denv=reference_ci_e2e
```
