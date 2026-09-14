# Go tests

| Folder | Role |
|--------|------|
| `tests-go-testing-net_http/` | **active** — HTTP block: `go test` + net/http + testify + Allure Go; `./cover-config.sh` + `sonar-tests` |
| `tests-go-testing-api_request-playwright/` | **active** — UI+HTTP: playwright-go + in-cell APIRequest; `./cover-config.sh` + `sonar-tests` |
| `tests-go-testing-playwright/` | slot — **UI-only** Playwright (no REST) |
| `tests-go-cdp/` | mill — IR crystals + `exec greedy run` (crystal column on `/stack/`) |
| `tests-go-vegeta/` | **active** — Vegeta (`layers: [performance]`; not CI; not wrk) |
