# tests-go-testing-allure3-playwright

`go test` · **playwright-go** · in-cell **net/http** (`api` + `ui` + `e2e`) · [testify](https://github.com/stretchr/testify) · [official Allure Go](https://github.com/allure-framework/allure-go).

Go UI school (`GetByTestId`, same `data-testid` as Java/TS Playwright). HTTP in this folder is net/http (same client as [`tests-go-testing-allure3-net_http`](../tests-go-testing-allure3-net_http/)), not a second clone folder. Default CI cell stays [`tests-java-gradle-junit5-allure3-selenide`](../../java/tests-java-gradle-junit5-allure3-selenide/). Mill stays [`tests-go-cdp`](../tests-go-cdp/). Not a generate sibling.

```bash
cd tests/go/tests-go-testing-allure3-playwright
go run github.com/mxschmitt/playwright-go/cmd/playwright@v0.6100.0 install chromium
cp .env.example .env   # optional; default STAND=prod → autotests.ai
go test ./tests/infra
./cover-config.sh   # 100% on ConfigReader analog (config.go)
go test ./tests/api
STAND=mock go test ./tests/ui
SCREENSHOT_BROWSER=chrome STAND=mock go test ./tests/ui ./tests/e2e -run Screenshot
go test ./tests/e2e
go test ./tests/manual
go test ./...
```

CI `sonar-tests` reads `coverage.out` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-go-testing-allure3-playwright`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to go playwright.

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. Packages are slices, not stands.
`STAND=ci` → UI [http://localhost:9821/](http://localhost:9821/) · API [http://localhost:8800/](http://localhost:8800/). Mock UI: `STAND=mock`. This cell is Chromium-only (`github.com/mxschmitt/playwright-go` v0.6100.0 · Playwright **1.61.1**, same Selenoid image as the TS cell).

Screenshot tests are two stages, not a pyramid layer. Tree:

`screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true go test ./tests/ui ./tests/e2e -run Screenshot
```

## Remote (Selenoid Playwright)

Same hub as the Java/JS Playwright cells. Live jobs set `SELENOID_PLAYWRIGHT_URL` (`wss://…/playwright/playwright-chromium/…`). Empty → local Chromium (or `CHROME_BINARY_PATH` = Chrome for Testing). Do not pass WebDriver `/wd/hub`.

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_PLAYWRIGHT_URL='wss://selenoid.qa.guru/playwright/playwright-chromium/1.61.1?accessKey=…'
go test ./tests/e2e
```

## Allure

```bash
npx allure generate ./allure-results
```
