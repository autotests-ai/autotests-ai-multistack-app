# tests-java-junit5-rest_assured-selenium

Gradle · JUnit 5 · Allure 3 · **Selenium 4** (not Selenide) · Rest Assured api layer.

**Living UI+HTTP block.** Same `data-testid` stems as the Selenide canon; page objects use `By` + `WebDriverWait`. HTTP-only school stays in sibling [`tests-java-junit5-rest_assured`](../tests-java-junit5-rest_assured/). Canon CI cell stays [`tests-java-junit5-rest_assured-selenide`](../tests-java-junit5-rest_assured-selenide/).

```bash
cd tests/java/tests-java-junit5-rest_assured-selenium
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot
```

Screenshot PNGs follow the Selenide tree (`mock|stage|prod/{linux|macos}/chrome-148`). Linux is CI SSOT — do not rewrite linux canon from macOS Chrome. Local Mac compare may skip screenshot (`-DexcludeTags=screenshot`).

Stand: `src/test/resources/config/` · `-Denv=ci` → [http://localhost:9821/](http://localhost:9821/) · API [http://localhost:8800/](http://localhost:8800/). Local Chrome is pinned via `chrome-for-testing.properties`. Selenoid: `-Denv=prod` + `SELENOID_WEBDRIVER_URL` / `-DremoteUrl=`.
