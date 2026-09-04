# tests-kotlin-junit5-ktor

Gradle · JUnit 5 · Allure 3 · **Ktor client** HTTP-only school.

No browser, no manual layer. Same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader). UI stays in Selenide / Selenium / Playwright siblings. Kotest+Ktor student emit (`kotlin-kotest-ktor`) is niche — not a second clone folder.

```bash
cd tests/kotlin/tests-kotlin-junit5-ktor
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
```

CI `sonar-tests` uses the Gradle Sonar plugin (JaCoCo xml from `infra-tests`). HTTP-only: no `mock` / `e2e` in this cell.

Stand: `-Denv=ci` → API [http://localhost:8800/](http://localhost:8800/).
