# Rust tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=rust`.
Living modules: `tests-rust-testing-reqwest` (HTTP-only),
`tests-rust-testing-selenium` (UI-only), and
`tests-rust-testing-reqwest-selenium` (UI+HTTP). Default clone CI stays Java Selenide.

Combo probe knobs: `TESTS_FRAMEWORK=testing` · `TESTS_REPORT=reqwest` ·
`TESTS_UI_LIBRARY=selenium`. HTTP-only: `TESTS_REPORT=reqwest` with no UI segment
(`tests-rust-testing-reqwest`). UI-only: `TESTS_UI_LIBRARY=selenium` with no HTTP
segment (`tests-rust-testing-selenium`). Playwright-on-Rust is not a cell.

HTTP-only: no `mock` / `e2e` in this family (dispatcher STOP — not a UI cell).
UI-only and combo mock/e2e/api verbs are not wired yet (dispatcher STOP until a later chat).

| Verb | Layer |
|------|-------|
| `infra` | `./cover-config.sh` (ConfigReader analog 100%; UI cells also LayoutCss + TokensCss) + `coverage.lcov` |
| `sonar` | scan + gate on `coverage.lcov` |
