# tests-java-junit5-api_request-playwright

Gradle · JUnit 5 · Allure 3 · **Playwright for Java** UI + **APIRequest** HTTP.

Same `data-testid` stems as the TypeScript Playwright living cell. Page objects use `getByTestId` / `Locator` behind `pages/App` (`app.login` / `app.header` / `app.home`). HTTP is Playwright `APIRequest`. The HTTP-only Rest Assured school stays in the sibling folder.

Local Chrome is **Chrome for Testing** (`LocalChromePin`, same pin file as Selenide). Screenshot PNG compare uses the same tree as Selenide.

```bash
cd tests/java/tests-java-junit5-api_request-playwright
./scripts/install-chrome-for-testing.sh   # once per machine (local Chrome pin)
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification
./gradlew test -Denv=ci -DincludeTags=api
./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot
SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot
./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot
```

Stand: `-Denv=ci` → gateway [http://localhost:9821/](http://localhost:9821/), API [http://localhost:8800/](http://localhost:8800/). Mock UI: `-Denv=mock` → [http://localhost:9911/](http://localhost:9911/).

Screenshot PNG path: `screenshots/{mock|stage|prod}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png`. Do **not** set `SCREENSHOT_OS=linux` on a Mac.

## Remote (Selenoid Playwright)

Same hub as the JS Playwright cell. Live jobs set `SELENOID_PLAYWRIGHT_URL` (`wss://…/playwright/playwright-chromium/…`). Empty → local Chrome for Testing. Do not pass WebDriver `/wd/hub` as `remoteUrl`.
