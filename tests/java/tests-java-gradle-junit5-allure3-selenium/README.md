# tests-java-gradle-junit5-allure3-selenium

Gradle · JUnit 5 · Allure 3 · **Selenium 4** (not Selenide) · Rest Assured api layer.

**Living UI+HTTP block.** Same `data-testid` stems as the Selenide canon; page objects use `By` + `WebDriverWait`. HTTP-only school stays in sibling [`tests-java-gradle-junit5-allure3-restassured`](../tests-java-gradle-junit5-allure3-restassured/). Canon CI cell stays [`tests-java-gradle-junit5-allure3-selenide`](../tests-java-gradle-junit5-allure3-selenide/).

```bash
cd tests/java/tests-java-gradle-junit5-allure3-selenium
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot,mock
```

Screenshot PNGs follow the Selenide tree (`mock|stage|prod/{linux|macos}/chrome-148`). Linux is CI SSOT — do not rewrite linux canon from macOS Chrome. Local Mac compare may skip screenshot (`-DexcludeTags=screenshot`).

Stand: `src/test/resources/config/` · `-Denv=ci` → [http://localhost:9821/](http://localhost:9821/) · API [http://localhost:8800/](http://localhost:8800/). Local Chrome is pinned via `chrome-for-testing.properties`. Selenoid: `-Denv=prod` + `SELENOID_WEBDRIVER_URL` / `-DremoteUrl=`.
