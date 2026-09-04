# tests-csharp-nunit-restsharp-selenium

NUnit · **Selenium 4** · [Allure.NUnit](https://www.nuget.org/packages/Allure.NUnit) · in-cell **RestSharp** (`api` + `ui` + `e2e`).

C# UI school (raw WebDriver). HTTP in this folder is RestSharp (same client as `tests-csharp-nunit-restsharp`), not a second clone folder. Default CI cell stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/). Java/Kotlin/Python Selenium canons stay in their folders. HTTP-only RestSharp school stays in the sibling folder. Not an xUnit/Playwright rewrite.

## Layers

One `dotnet test`; the layer is a category filter, the stand is `STAND`.

| Layer | Command | Notes |
|-------|---------|--------|
| infra (all) | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` | Coverlet **100%** `ConfigReader` + `LayoutCss` + `TokensCss` |
| infra-backend | `dotnet test --filter TestCategory=infra_backend /p:CollectCoverage=true /p:Include="[*]Config.ConfigReader"` | `ConfigReader` 100% |
| infra-frontend | `dotnet test --filter TestCategory=infra_frontend /p:CollectCoverage=true /p:Include="[*]Helpers.LayoutCss,[*]Helpers.TokensCss"` | CSS helpers 100% |
| api | `dotnet test --filter TestCategory=api` | in-cell RestSharp · same `/api` catalog as the HTTP-only RestSharp cell |
| ui | `STAND=mock dotnet test --filter "TestCategory=ui&TestCategory!=screenshot"` | browser on stub API |
| screenshot mock | `SCREENSHOT_BROWSER=chrome STAND=mock dotnet test --filter TestCategory=screenshot` | PNG tree matches Java Selenium |
| e2e | `dotnet test --filter "TestCategory=e2e&TestCategory!=screenshot"` | live-backend journeys |
| manual | `dotnet test --filter TestCategory=manual` | Allure steps |

CI `sonar-tests` reads `coverage.opencover.xml` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-csharp-nunit-restsharp-selenium`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to csharp selenium.

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Categories are slices, not stands.
`STAND=ci` → UI [http://localhost:9821/](http://localhost:9821/) · API [http://localhost:8800/](http://localhost:8800/). Mock UI: `STAND=mock`. Local Chrome is pinned via `chrome-for-testing.properties`. This cell is Chrome-only.

Screenshot tests are two stages, not a pyramid layer. Tree:

`screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true dotnet test --filter TestCategory=screenshot
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_WEBDRIVER_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
dotnet test --filter TestCategory=e2e
```

## Allure

```bash
npx allure generate ./bin/Debug/net8.0/allure-results
```
