# tests-go-testing-allure3

Living Go cell: `go test` + [official Allure Go](https://github.com/allure-framework/allure-go) + [testify](https://github.com/stretchr/testify). HTTP contract of the teaching app — same questions as Java `AuthApiTests` / `HealthItemsApiTests`.

Not Playwright. Browser UI stays in `tests-typescript-playwright` / Selenide. Not the IR mill (`tests-go-cdp`).

```bash
cd tests/go/tests-go-testing-allure3
cp .env.example .env   # optional; default STAND=prod
export ALLURE_RESULTS_DIR=allure-results
go test ./...
```

Stand is `STAND` (`prod` default) or `API_BASE_URL`. Layers: **api** only.

Allure 3:

```bash
npx allure generate ./allure-results
```
