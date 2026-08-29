# tests-java-gradle-junit5-allure3-selenium

Gradle · JUnit 5 · Allure 3 · **Selenium 4** (not Selenide).

**UI block.** HTTP client is a sibling folder (`tests-java-gradle-junit5-allure3-restassured`). `helpers.AuthHttp` is fixture plumbing (register / delete cleanup), not that school.

Canon Selenide cell stays `tests-java-gradle-junit5-allure3-selenide` (CI default). This module is the raw WebDriver school: `By` + `WebDriverWait`, same `data-testid` locators.

```bash
cd tests/java/tests-java-gradle-junit5-allure3-selenium
./gradlew test -Denv=ci -DincludeTags=e2e
```

Stand: `src/test/resources/config/` · `-Denv=ci` → [http://localhost:9821/](http://localhost:9821/). Local Chrome is pinned via `chrome-for-testing.properties` (`scripts/install-chrome-for-testing.sh`). Selenoid: `-Denv=prod` + `SELENOID_WEBDRIVER_URL` / `-DremoteUrl=`.
