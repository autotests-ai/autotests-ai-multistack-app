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
| harness | `./gradlew test -Denv=reference_ci -DincludeTags=harness` | `src/test/java/tests/testinfra/` · `@Layer("harness")` + `@Tag("harness")` |
| api | `./gradlew test -Denv=reference_ci -DincludeTags=api` | Rest Assured |
| integration | `./gradlew test -Denv=reference_ci -DincludeTags=mount` | mount probes (header, login form on SPA) |
| e2e | `./gradlew test -Denv=reference_ci -DincludeTags=e2e -DexcludeTags=visual` | flow; add `,visual` for PNG baselines |
| e2e baselines | `./gradlew test -Denv=reference_ci -DincludeTags=visual -DupdateBaselines=true` | refresh PNGs under `src/test/resources/screenshots/` |

Swap `-Denv=reference_prod` to run the same filter against the deployed stack via Selenoid.
Stands live in `src/test/resources/config/`; every other key is a `-D` override on top of
`default.properties`.

Naming matrix for other Java stacks: [../../NAMING.md](../../NAMING.md).
