# Go tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=go`.
Live module: `tests-go-testing-net_http` (HTTP-only).
Folder id has no report segment (`TESTS_REPORT` stays a CI knob):
`tests-go-testing-net_http` · `tests-go-testing-api_request-playwright`.

HTTP-only: no `mock` / `e2e` in this family (dispatcher STOP — not a UI cell).

| Verb | Layer |
|------|-------|
| `infra` | `./cover-config.sh` (ConfigReader analog 100%) + `coverage.out` |
| `sonar` | scan + gate on `coverage.out` |
