# Backend — Go

Two teaching stacks, same JSON contract as `backend-java-spring`:

| Module | Port | Status | Notes |
|--------|------|--------|-------|
| [`backend-go-gin`](backend-go-gin/) | 8830 | active | [Gin](https://github.com/gin-gonic/gin) — usual product REST course stack |
| [`backend-go-stdlib`](backend-go-stdlib/) | 8831 | active | `net/http` + `ServeMux` — same style as Selenoid hub (no framework) |

Unit tests: `go test ./...` in each module.

Routing SSOT: [`deploy/matrix.yaml`](../../deploy/matrix.yaml).
