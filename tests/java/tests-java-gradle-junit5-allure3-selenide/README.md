# tests-java-gradle-junit5-allure3-selenide

Gradle · JUnit 5 · Allure 3 · Selenide · Rest Assured.

Canonical Java automation module for reference-app-copy ([`ci.yml`](../../../.github/workflows/ci.yml)).

**Not** backend unit tests → `backend/java/backend-java-spring/src/test/java/`.  
**Not** RTL → `frontend/typescript/frontend-typescript-react/src/test/`.

## Siblings (other languages)

| Path | Stack |
|------|-------|
| [`../../javascript/tests-javascript-playwright/`](../../javascript/tests-javascript-playwright/) | Playwright |
| [`../../python/tests-python-selenium/`](../../python/tests-python-selenium/) | pytest · Selenium |

## Layers

One task `test`; the layer is a tag filter, the stand is `-Denv` ([../../LAYERS.md](../../LAYERS.md)).

| Layer | Command | Notes |
|-------|---------|--------|
| harness (all) | `./gradlew test -Denv=reference_ci -DincludeTags=harness` | umbrella — all `testinfra/` · CI job `sonar-tests` |
| harness-backend | `./gradlew test -Denv=reference_ci -DincludeTags=harness-backend` | `ConfigReader` · CI backend lane |
| harness-frontend | `./gradlew test -Denv=reference_ci -DincludeTags=harness-frontend` | CSS + HAR helpers · CI frontend lane |
| api | `./gradlew test -Denv=reference_ci -DincludeTags=api` | local compose (`reference_ci`); **CI** `api-tests` uses `-Denv=reference_prod` |
| mock | `./gradlew test -Denv=reference_mock -DincludeTags=mock` | stub API mount checks · CI `ui-mock-tests` step 1 |
| screenshot mock | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=reference_mock -DincludeTags=screenshot` | PNG compare `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` compare step |
| e2e | `./gradlew test -Denv=reference_ci -DincludeTags=e2e -DexcludeTags=screenshot,mock` | flow; screenshot is a second stage, not a pyramid layer |
| screenshot mock refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=reference_mock -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` step `Update screenshots` (`update_mock_screenshots`) |
| screenshot e2e refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=reference_prod -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/e2e/linux/chrome-148/` · CI `e2e-tests` step `Update screenshots` (`update_e2e_screenshots`) |
| manual | `./gradlew test -Denv=reference_ci -DincludeTags=manual` | **in code** — `@Manual` + Allure steps · `tests/manual/` (not a wiki checklist) |

Swap `-Denv=reference_prod` to run the same filter against the deployed stack via Selenoid
(CI `api-tests` / `e2e-tests` already use `reference_prod`; local api/e2e against compose stay on `reference_ci`).
Stands live in `src/test/resources/config/`; every other key is a `-D` override on top of
`default.properties`.

Screenshot PNG path: `screenshots/{mock|e2e}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png`.
CI SSOT is `mock/linux/chrome-148` plus the CFT pin in `chrome-for-testing.properties`.
Other browsers are sibling folders (`firefox-140/` would not be read by this job).
Do **not** set `SCREENSHOT_OS=linux` on a Mac.

Naming matrix for other Java stacks: [../../NAMING.md](../../NAMING.md).
