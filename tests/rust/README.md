# Rust tests

| Folder | Role |
|--------|------|
| `tests-rust-testing-reqwest/` | **active** — HTTP block: `cargo test` + reqwest + allure-cargotest / allure-reqwest; `./cover-config.sh` + `sonar-tests` |
| `tests-rust-testing-selenium/` | **active** — UI-only: thirtyfour; `./cover-config.sh` + `sonar-tests` |
| `tests-rust-testing-reqwest-selenium/` | **active** — UI+HTTP: thirtyfour + in-cell reqwest; `./cover-config.sh` + `sonar-tests` |

Playwright-on-Rust is not a cell. Default clone CI stays Java Selenide.
