# Backend — Go

Two teaching stacks, same JSON contract as `backend-java-spring`:

| Module | Port | Status | Notes |
|--------|------|--------|-------|
| [`backend-go-gin`](backend-go-gin/) | 8830 | active | [Gin](https://github.com/gin-gonic/gin) — usual product REST course stack |
| [`backend-go-stdlib`](backend-go-stdlib/) | 8831 | active | `net/http` + `ServeMux` — same style as Selenoid hub (no framework) |

Unit tests: `go test ./...` in each module.

CI verbs match the default Java stack: unit (`go test` + coverprofile) ·
integration (scratch `postgres:16-alpine`, `TEST_DATABASE_URL`) ·
build / deploy (Docker context = module folder) · Sonar (`coverage.out`).
Same orchestrator: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) with
`BACKEND_LANG: go` and `BACKEND_FRAMEWORK: gin` / `stdlib`.
Actions: [`backend/go/.github/actions/`](.github/actions/).

Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).
