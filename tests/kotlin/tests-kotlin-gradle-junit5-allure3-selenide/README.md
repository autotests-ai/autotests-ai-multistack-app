# tests-kotlin-gradle-junit5-allure3-selenide

Gradle · JUnit 5 · Allure 3 · **Selenide** · in-cell **Ktor** (`api` + `ui` + `e2e`).

Kotlin UI school. HTTP in this folder is Ktor (same client as `tests-kotlin-gradle-junit5-allure3-ktor`), not a second clone folder. Default CI cell stays [`tests-java-gradle-junit5-allure3-selenide`](../../java/tests-java-gradle-junit5-allure3-selenide/). HTTP-only Ktor school stays in the sibling folder.

## Layers

One task `test`; the layer is a tag filter, the stand is `-Denv` ([pyramid-map.yaml](../../../_contract/pyramid-map.yaml)).

| Layer | Command | Notes |
|-------|---------|--------|
| infra (all) | `./gradlew test -Denv=ci -DincludeTags=infra jacocoTestCoverageVerification` | JaCoCo **100%** `ConfigReader` + `LayoutCss` + `TokensCss` |
| infra-backend | `./gradlew test -Denv=ci -DincludeTags=infra-backend jacocoTestCoverageVerification` | `ConfigReader` 100% |
| infra-frontend | `./gradlew test -Denv=ci -DincludeTags=infra-frontend jacocoTestCoverageVerification` | CSS helpers 100% |
| api | `./gradlew test -Denv=ci -DincludeTags=api` | in-cell Ktor · same `/api` catalog as the HTTP-only Ktor cell |
| ui | `./gradlew test -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot` | browser on stub API |
| screenshot mock | `SCREENSHOT_BROWSER=chrome ./gradlew test -Denv=mock -DincludeTags=screenshot` | PNG tree matches Java Selenide |
| e2e | `./gradlew test -Denv=ci -DincludeTags=e2e -DexcludeTags=screenshot` | live-backend journeys |
| manual | `./gradlew test -Denv=ci -DincludeTags=manual` | `@Manual` + Allure steps |

CI `sonar-tests` uses the Gradle Sonar plugin (`projectKey` `autotests-ai-multistack-app-tests-kotlin-gradle-junit5-allure3-selenide`, gate `qa-guru-canon`). Do not flip clone `TESTS_LANG` to kotlin.

Stand: `-Denv=ci` → app [http://localhost:8800/](http://localhost:8800/). Mock UI: `-Denv=mock`.
