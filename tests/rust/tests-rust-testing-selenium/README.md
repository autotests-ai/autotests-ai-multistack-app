# tests-rust-testing-selenium

`cargo test` · **thirtyfour** (Selenium WebDriver) · [allure-cargotest](https://crates.io/crates/allure-cargotest). **UI-only** — `layers: [ui, e2e]`. Same UI `DisplayName` / PNG tree as the combo. No `/api` catalog.

HTTP school stays [`tests-rust-testing-reqwest`](../tests-rust-testing-reqwest/). Combo (UI+HTTP, in-cell reqwest) stays [`tests-rust-testing-reqwest-selenium`](../tests-rust-testing-reqwest-selenium/). Playwright-on-Rust is not a cell. Default CI stays [`tests-java-junit5-rest_assured-selenide`](../../java/tests-java-junit5-rest_assured-selenide/).

Throwaway register / localStorage login / WireMock admin use a fixture HTTP client in-cell — not a second HTTP folder.

## Layers

| Layer | Command | Notes |
|-------|---------|--------|
| infra | `cargo test --test infra` · `./cover-config.sh` | **100%** ConfigReader analog + LayoutCss + TokensCss |
| ui | `STAND=mock cargo test --test ui -- --test-threads=1` | browser on stub API |
| e2e | `cargo test --test e2e -- --test-threads=1` | live-backend journeys |

CI `sonar-tests` reads `coverage.lcov` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-rust-testing-selenium`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` / `TESTS_UI_LIBRARY` to rust selenium.

Stand is `STAND` (`prod` default) or `BASE_URL`. `STAND=ci` → UI [http://localhost:9821/](http://localhost:9821/). Mock UI: `STAND=mock`. Local Chrome is pinned via `chrome-for-testing.properties`. This cell is Chrome-only.

Screenshot tests are two stages, not a pyramid layer. Tree:

`screenshots/{mock|stage|prod}/{linux|macos|windows}/chrome-148/{area}/{viewport}.png`

CI writes `linux` (`SCREENSHOT_OS=linux`). On a Mac do **not** set `SCREENSHOT_OS=linux`.

```bash
cd tests/rust/tests-rust-testing-selenium
cp .env.example .env   # optional; default STAND=prod → autotests.ai
cargo test --test infra
./cover-config.sh
SCREENSHOT_BROWSER=chrome STAND=mock UPDATE_SCREENSHOTS=true HEADLESS=true cargo test --test ui -- --test-threads=1
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export SELENOID_WEBDRIVER_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
cargo test --test e2e -- --test-threads=1
```

## Allure

```bash
ALLURE_RESULTS_DIR=./allure-results cargo test --test ui -- --test-threads=1
npx allure generate ./allure-results
```
