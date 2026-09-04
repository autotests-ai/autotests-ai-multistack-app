# tests-csharp-xunit-api_request-playwright

xUnit.net · **Playwright** · [Allure.Xunit](https://www.nuget.org/packages/Allure.Xunit) · in-cell **APIRequest** (`api` + `ui` + `e2e`).

C# UI school (Playwright `GetByTestId`, same `data-testid` as Java/TS Playwright). HTTP in this folder is Playwright `APIRequest`, not RestSharp. Default CI cell stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/). Java/Kotlin/Python Playwright canons stay in their folders. HTTP-only RestSharp school stays in the sibling folder. Not an NUnit/Selenium rewrite.

## Layers

One `dotnet test`; the layer is a trait filter (`TestCategory`), the stand is `STAND`.

| Layer | Command | Notes |
|-------|---------|--------|
| infra (all) | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` | Coverlet **100%** `ConfigReader` + `LayoutCss` + `TokensCss` |
| infra-backend | `dotnet test --filter TestCategory=infra_backend /p:CollectCoverage=true /p:Include="[*]Config.ConfigReader"` | `ConfigReader` 100% |
| infra-frontend | `dotnet test --filter TestCategory=infra_frontend /p:CollectCoverage=true /p:Include="[*]Helpers.LayoutCss,[*]Helpers.TokensCss"` | CSS helpers 100% |
| api | `dotnet test --filter TestCategory=api` | in-cell APIRequest · same `/api` catalog as the HTTP-only RestSharp cell |
| ui | `STAND=mock dotnet test --filter "TestCategory=ui&TestCategory!=screenshot"` | browser on stub API |
| screenshot mock | `SCREENSHOT_BROWSER=chrome STAND=mock dotnet test --filter TestCategory=screenshot` | PNG tree matches Java Playwright |
| e2e | `dotnet test --filter "TestCategory=e2e&TestCategory!=screenshot"` | live-backend journeys |
| manual | `dotnet test --filter TestCategory=manual` | Allure steps |

CI `sonar-tests` reads `coverage.opencover.xml` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-csharp-xunit-api_request-playwright`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to csharp playwright.

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Categories are slices, not stands.
`STAND=ci` → UI [http://localhost:9821/](http://localhost:9821/) · API [http://localhost:8800/](http://localhost:8800/). Mock UI: `STAND=mock`. Local Chrome is pinned via `chrome-for-testing.properties`. This cell is Chromium-only.

Screenshot tests are two stages, not a pyramid layer. Tree:

`screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true dotnet test --filter TestCategory=screenshot
```

## Remote (Selenoid Playwright)

Same hub as the Java/JS Playwright cells. Live jobs set `SELENOID_PLAYWRIGHT_URL` (`wss://…/playwright/playwright-chromium/…`). Empty → local Chrome for Testing. Do not pass WebDriver `/wd/hub`.

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_PLAYWRIGHT_URL='wss://selenoid.qa.guru/playwright/playwright-chromium/1.61.1?accessKey=…'
dotnet test --filter TestCategory=e2e
```

## Allure

```bash
npx allure generate ./bin/Debug/net8.0/allure-results
```
