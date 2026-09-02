# tests-kotlin-gradle-junit5-allure3-playwright

Gradle · JUnit 5 · Allure 3 · **Playwright for Java** UI · in-cell **Ktor** (`api` + `ui` + `e2e`).

Kotlin Playwright school. Page objects use `getByTestId` / `Locator` behind `pages/App` (`app.login` / `app.header` / `app.home`). HTTP in this folder is Ktor (same client as `tests-kotlin-gradle-junit5-allure3-ktor`), not a second clone folder. Default CI cell stays [`tests-java-gradle-junit5-allure3-selenide`](../../java/tests-java-gradle-junit5-allure3-selenide/). Java Playwright canon stays [`tests-java-gradle-junit5-allure3-playwright`](../../java/tests-java-gradle-junit5-allure3-playwright/). HTTP-only Ktor school stays in the sibling folder. Not a Selenide/Selenium rewrite.

Local Chrome is **Chrome for Testing** (`LocalChromePin`, same pin file as Java Playwright). Screenshot PNG tree is the Java Playwright canon — do not invent extra PNGs.

```bash
cd tests/kotlin/tests-kotlin-gradle-junit5-allure3-playwright
./scripts/install-chrome-for-testing.sh   # once per machine (local Chrome pin)
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot
```

## Layers

One task `test`; the layer is a tag filter, the stand is `-Denv` ([pyramid-map.yaml](../../../_contract/pyramid-map.yaml)).

| Layer | Command | Notes |
|-------|---------|--------|
| infra (all) | `./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification` | JaCoCo **100%** `ConfigReader` + `LayoutCss` + `TokensCss` |
| infra-backend | `./gradlew test -Denv=ci -DincludeTags=infra-backend jacocoTestCoverageVerification` | `ConfigReader` 100% |
| infra-frontend | `./gradlew test -Denv=ci -DincludeTags=infra-frontend jacocoTestCoverageVerification` | CSS helpers 100% |
| api | `./gradlew test -Denv=ci -DincludeTags=api` | in-cell Ktor · same `/api` catalog as the HTTP-only Ktor cell |
| ui | `./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot` | browser on stub API |
| screenshot mock | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot` | PNG tree matches Java Playwright |
| e2e | `./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot` | live-backend journeys |
| manual | `./gradlew test -Denv=ci -DincludeTags=manual` | `@Manual` + Allure steps |

CI `sonar-tests` uses the Gradle Sonar plugin (`projectKey` `autotests-ai-multistack-app-tests-kotlin-gradle-junit5-allure3-playwright`, gate `qa-guru-canon`). Do not flip clone `TESTS_LANG` to kotlin.

Stand: `-Denv=ci` → gateway [http://localhost:9821/](http://localhost:9821/), API [http://localhost:8800/](http://localhost:8800/). Mock UI: `-Denv=mock` → [http://localhost:9911/](http://localhost:9911/).

Screenshot PNG path: `screenshots/{mock|stage|prod}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png`. Do **not** set `SCREENSHOT_OS=linux` on a Mac.

## Remote (Selenoid Playwright)

Same hub as the Java/JS Playwright cells. Live jobs set `SELENOID_PLAYWRIGHT_URL` (`wss://…/playwright/playwright-chromium/…`). Empty → local Chrome for Testing. Do not pass WebDriver `/wd/hub` as `remoteUrl`.
