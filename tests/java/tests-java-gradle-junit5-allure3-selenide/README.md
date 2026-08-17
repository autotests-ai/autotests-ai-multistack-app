# tests-java-gradle-junit5-allure3-selenide

Gradle · JUnit 5 · Allure 3 · Selenide · Rest Assured.

Canonical Java automation module for autotests-ai-multistack-app ([`ci.yml`](../../../.github/workflows/ci.yml)).

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
| harness (all) | `./gradlew test -Denv=multistack_ci -DincludeTags=harness` | umbrella — all `testinfra/` · CI job `tests-harness` (feeds `sonar-tests`) |
| harness-backend | `./gradlew test -Denv=multistack_ci -DincludeTags=harness-backend` | `ConfigReader` · backend-only lane |
| harness-frontend | `./gradlew test -Denv=multistack_ci -DincludeTags=harness-frontend` | CSS + HAR + `LocalChromePin` · inside full `tests-harness` (frontend lane included) |
| api | `./gradlew test -Denv=multistack_ci -DincludeTags=api` | local compose (`multistack_ci`); **CI** `api-tests` uses `-Denv=multistack_prod "-DincludeTags=api&prod"`; `api-tests-stage` uses `-Denv=multistack_stage -DincludeTags=api` |
| mock | `./gradlew test -Denv=multistack_mock -DincludeTags=mock` | stub API mount checks · CI `ui-mock-tests` step 1 |
| screenshot mock | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=multistack_mock -DincludeTags=screenshot` | PNG compare `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` compare step |
| e2e | `./gradlew test -Denv=multistack_ci -DincludeTags=e2e -DexcludeTags=screenshot,mock` | flow; screenshot is a second stage, not a pyramid layer. CI prod: `e2e&prod`; CI stage: full `e2e` |
| screenshot mock refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=multistack_mock -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` step `Update screenshots` (`update_mock_screenshots`) |
| screenshot e2e refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=multistack_prod -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/e2e/linux/chrome-148/` · CI `e2e-tests` step `Update screenshots` (`update_e2e_screenshots`) |
| manual | `./gradlew test -Denv=multistack_ci -DincludeTags=manual` | **in code** — `@Manual` + Allure steps · `tests/manual/` (not a wiki checklist) |

Swap `-Denv=multistack_prod` / `multistack_stage` to run the same filter against a deployed stack via Selenoid.
CI: push `develop` → stage + full `api` / `e2e`. Push `main` → that SHA to stage (full layer), then prod + `@Tag("prod")`.
Local api/e2e against compose stay on `multistack_ci`.

| Stand (`-Denv`) | CI jobs | Filter |
|-----------------|---------|--------|
| `multistack_stage` | `api-tests-stage` / `e2e-tests-stage` (push `develop`; also push `main` before prod) | full `api` / `e2e` (`excludeTags=mock,screenshot`) |
| `multistack_prod` | `api-tests` / `e2e-tests` (push `main`, after stage e2e) | `api&prod` / `e2e&prod` (AND token, not CSV) · e2e still `excludeTags=mock,screenshot` |

`@Tag("prod")` is an environment slice (seeded GET + login), **not** `@Layer` and **not** `@Tag("smoke")`.
Stands live in `src/test/resources/config/`; every other key is a `-D` override on top of
`default.properties`.

Screenshot PNG path: `screenshots/{mock|e2e}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png`.
CI SSOT is `mock/linux/chrome-148` plus the CFT pin in `chrome-for-testing.properties`.
Other browsers are sibling folders (`firefox-140/` would not be read by this job).
Do **not** set `SCREENSHOT_OS=linux` on a Mac.

## Allure CLI pins

Exact versions live in `package.json`; the install tree is `package-lock.json`. CI runs `npm ci` (job `allure-npm-lock` checks they match; `publish-allure-report` is gating on generate). After changing pins:

```bash
nvm use 26 && npm install --package-lock-only
node scripts/check-package-lock.mjs
```

Commit both files. Do not use `latest`.

Naming matrix for other Java stacks: [../../NAMING.md](../../NAMING.md).
