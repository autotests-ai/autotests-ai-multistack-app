# tests-go-testing-allure3-net_http

`go test` · **net/http** · [testify](https://github.com/stretchr/testify) · [official Allure Go](https://github.com/allure-framework/allure-go). HTTP-only school — same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). No browser.

Sibling UI block: [`tests-go-testing-allure3-playwright`](../tests-go-testing-allure3-playwright/). Mill: [`tests-go-cdp`](../tests-go-cdp/). Combo with Playwright = generate, not a third folder.

```bash
cd tests/go/tests-go-testing-allure3-net_http
cp .env.example .env   # optional; default STAND=prod → autotests.ai
go test ./tests/infra
./cover-config.sh   # 100% on ConfigReader analog (JaCoCo sibling)
go test ./tests/api
go test ./tests/manual
go test ./...
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Packages are slices, not stands.

## Allure

```bash
npx allure generate ./allure-results
```
