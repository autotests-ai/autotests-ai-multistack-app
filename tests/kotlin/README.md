# Kotlin tests

Pattern: `tests-kotlin-{build}-{framework}-{reporting}-{automation}` — see [../NAMING.md](../NAMING.md).

| Folder | Status |
|--------|--------|
| `tests-kotlin-gradle-junit5-allure3-selenide` | **active** — UI+HTTP Selenide + in-cell Ktor; JaCoCo + `sonar-tests` |
| `tests-kotlin-gradle-junit5-allure3-selenium` | slot — UI block Selenium |
| `tests-kotlin-gradle-junit5-allure3-playwright` | slot — UI block Playwright |
| `tests-kotlin-gradle-junit5-allure3-ktor` | **active** — HTTP block Ktor client; JaCoCo + `sonar-tests` |
| `tests-kotlin-gradle-gatling` | slot — Gatling Kotlin DSL (`layers: [performance]`) |
