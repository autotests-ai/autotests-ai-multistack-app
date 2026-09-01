# tests-kotlin-gradle-junit5-allure3-ktor

Gradle · JUnit 5 · Allure 3 · **Ktor client** HTTP-only school.

No browser. Same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). UI stays in Selenide / Selenium / Playwright siblings. Kotest+Ktor student emit (`kotlin-gradle-kotest-ktor`) is niche — not a second clone folder.

```bash
cd tests/kotlin/tests-kotlin-gradle-junit5-allure3-ktor
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=prod -DincludeTags=manual
```

Stand: `-Denv=ci` → API [http://localhost:8800/](http://localhost:8800/).
