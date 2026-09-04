# tests-java-junit5-retrofit2

Gradle · JUnit 5 · Allure 3 · **Retrofit 2** HTTP-only school.

No browser. Same `/api` contract as the Rest Assured HTTP block and the Selenide/Selenium living cells. Typed Retrofit interface + `Call.execute()`, not Rest Assured `given()`. UI stays in sibling folders.

```bash
cd tests/java/tests-java-junit5-retrofit2
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
```

Stand: `-Denv=ci` → API [http://localhost:8800/](http://localhost:8800/).
