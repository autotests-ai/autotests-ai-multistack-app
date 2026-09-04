# tests-rust-testing-reqwest

`cargo test` · **reqwest** · [allure-cargotest](https://crates.io/crates/allure-cargotest) + [allure-reqwest](https://github.com/allure-framework/allure-rust/tree/main/crates/allure-reqwest). HTTP-only school — same `/api` catalog as Go net/http and Java Rest Assured (31 api + 9 ConfigReader). No browser, no manual layer.

Combo (UI+HTTP): [`tests-rust-testing-reqwest-selenium`](../tests-rust-testing-reqwest-selenium/). UI-only sibling: [`tests-rust-testing-selenium`](../tests-rust-testing-selenium/). Playwright-on-Rust is not a cell.

```bash
cd tests/rust/tests-rust-testing-reqwest
cp .env.example .env   # optional; default STAND=prod → autotests.ai
cargo test --test infra
./cover-config.sh   # 100% on ConfigReader analog (JaCoCo sibling)
cargo test --test api
cargo test
```

CI `sonar-tests` reads `coverage.lcov` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-tests-rust-testing-reqwest`, gate `qa-guru-canon`).
Do not flip clone `TESTS_LANG` to rust.

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Packages are slices, not stands.

## Allure

```bash
ALLURE_RESULTS_DIR=./allure-results cargo test
npx allure generate ./allure-results
```
