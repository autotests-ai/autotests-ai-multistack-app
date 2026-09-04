# Kotlin tests

Pattern: see [../NAMING.md](../NAMING.md). **UI-only** slots: `tests-kotlin-junit5-{selenide,selenium,playwright}`. Do not put `gradle` / `allure2` / `allure3` in the folder id.

| Folder | Status |
|--------|--------|
| `tests-kotlin-junit5-ktor-selenide` | **active** — UI+HTTP Selenide + in-cell Ktor; JaCoCo + `sonar-tests` |
| `tests-kotlin-junit5-ktor-selenium` | **active** — UI+HTTP Selenium + in-cell Ktor; JaCoCo + `sonar-tests` |
| `tests-kotlin-junit5-api_request-playwright` | **active** — UI+HTTP Playwright + in-cell APIRequest; JaCoCo + `sonar-tests` |
| `tests-kotlin-junit5-selenide` | slot — **UI-only** Selenide (no REST) |
| `tests-kotlin-junit5-selenium` | slot — **UI-only** Selenium (no REST) |
| `tests-kotlin-junit5-playwright` | slot — **UI-only** Playwright (no REST) |
| `tests-kotlin-junit5-ktor` | **active** — HTTP block Ktor client; JaCoCo + `sonar-tests` |
| `tests-kotlin-gatling` | slot — Gatling Kotlin DSL (`layers: [performance]`) |
