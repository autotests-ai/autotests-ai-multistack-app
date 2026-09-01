# tests-java-gradle-junit5-allure3-restassured

Gradle · JUnit 5 · Allure 3 · **Rest Assured** HTTP-only school.

No browser. Same `/api` contract as the Selenide/Selenium living cells. UI stays in sibling folders. Retrofit 2 is [`tests-java-gradle-junit5-allure3-retrofit2`](../tests-java-gradle-junit5-allure3-retrofit2/).

```bash
cd tests/java/tests-java-gradle-junit5-allure3-restassured
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
```

Stand: `-Denv=ci` → API [http://localhost:8800/](http://localhost:8800/).
