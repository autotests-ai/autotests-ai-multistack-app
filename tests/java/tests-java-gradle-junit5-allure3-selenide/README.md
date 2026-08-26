# tests-java-gradle-junit5-allure3-selenide

Gradle · JUnit 5 · Allure 3 · Selenide · Rest Assured.

Canonical Java automation module. CI: clone [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) (same file in the takeaway).

**Not** backend unit tests → `backend/java/backend-java-spring/src/test/java/`.  
**Not** RTL → `frontend/typescript/frontend-typescript-react/src/test/`.

Other language stacks live in the matrix catalog, not this ethalon tree: [MATRIX-CATALOG.md](../../../../../../docs/testing/MATRIX-CATALOG.md).

## Layers

One task `test`; the layer is a tag filter, the stand is `-Denv` ([pyramid-map.yaml](../../../_contract/pyramid-map.yaml)).

| Layer | Command | Notes |
|-------|---------|--------|
| infra (all) | `./gradlew test -Denv=ci -DincludeTags=infra` | umbrella — all `infra/` · CI job `infra-tests` (feeds `sonar-tests`; gates `ui-mock-tests` / `api-tests` / `e2e-tests`) |
| infra-backend | `./gradlew test -Denv=ci -DincludeTags=infra-backend` | `ConfigReader` · `AllureHttpHtml` · backend-only lane |
| infra-frontend | `./gradlew test -Denv=ci -DincludeTags=infra-frontend` | CSS + HAR + `LocalChromePin` · inside full `infra-tests` (frontend lane included) |
| api | `./gradlew test -Denv=ci -DincludeTags=api` | local compose; CI job `api-tests` |
| api smoke | `./gradlew test -Denv=prod -DincludeTags='api & smoke'` | prod subset (health, seed, login); CI job `api-tests` |
| mock | `./gradlew test -Denv=mock -DincludeTags=mock` | stub API mount checks · CI `ui-mock-tests` step 1 |
| screenshot mock | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot` | PNG compare `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` compare step |
| e2e | `./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot,mock` | flow; screenshot is a second stage, not a pyramid layer |
| e2e smoke | `./gradlew test -Denv=prod -DincludeTags='e2e & smoke' -DexcludeTags=screenshot,mock` | prod subset (login + home); CI job `e2e-tests` (Selenoid) |
| screenshot mock refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/mock/linux/chrome-148/` · CI `ui-mock-tests` step `Update screenshots` (`update_mock_screenshots`) |
| screenshot stage refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=stage -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/stage/linux/chrome-148/` · CI `e2e-tests-stage` step `Update screenshots` (`update_stage_screenshots`) |
| screenshot ci refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=ci -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/prod/linux/chrome-148/` (same folder as prod; not live `-Denv=prod`). Local compose stand — not a GHA job |
| screenshot prod refresh | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=prod -DincludeTags=screenshot -DupdateScreenshots=true` | writes `screenshots/prod/linux/chrome-148/` · CI `e2e-tests` step `Update screenshots` (`update_e2e_screenshots`) |
| manual | `./gradlew test -Denv=ci -DincludeTags=manual` | **in code** — `@Manual` + Allure steps · `tests/manual/` (not a wiki checklist) |

CI `api-tests` / `e2e-tests` run against prod after deploy (`-Denv=prod`; jobs `needs` `infra-tests`).  
Pipeline `-Denv=ci` is local. Stage: `api-tests-stage` / `e2e-tests-stage`. Same
filters locally: swap `-Denv`. Combined smoke (api+e2e): `-DincludeTags=smoke`.
Stands live in `src/test/resources/config/`; every other key is a `-D` override on top of
`default.properties`.

Screenshot PNG path: `screenshots/{mock|stage|prod}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png`.
`ci` reads `prod/` (same linux SSOT as the prod stand).
CI SSOT is `{mock|stage|prod}/linux/chrome-148` plus the CFT pin in `chrome-for-testing.properties`.
Other browsers are sibling folders (`firefox-140/` would not be read by this job).
Do **not** set `SCREENSHOT_OS=linux` on a Mac.

## Allure CLI pins

Exact versions live in `package.json`; the install tree is `package-lock.json`. CI runs `npm ci` (job `allure-npm-lock` checks they match; `publish-allure-report` is gating on generate). After changing pins:

```bash
nvm use 26 && npm install --package-lock-only
node scripts/check-package-lock.mjs
```

Commit both files. Do not use `latest`.
