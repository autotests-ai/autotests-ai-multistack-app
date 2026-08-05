# backend-go-stdlib

Go JSON API on **stdlib only** (`net/http`, `http.ServeMux`) — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_go_stdlib`.

**Status:** active.

```
https://reference-app-copy.autotests.ai/backend-go-stdlib/{frontend}/
https://reference-app-copy.autotests.ai/backend-go-stdlib/api/
```

Unit tests: `internal/**/*_test.go`.  
Run: `go test ./...` (no database needed — handlers talk to the `store.Store` interface).

The PostgreSQL tests in `internal/store/postgres_integration_test.go` skip unless a scratch
database is given:

```
TEST_DATABASE_URL=postgres://reference:reference@localhost:5432/scratch?sslmode=disable go test ./...
```

Pair with [`backend-go-gin`](../backend-go-gin/): Gin = product-course ergonomics; stdlib = infra-style Go (Selenoid/GGR mental model). Do not rewrite Selenoid onto Gin — teach both here instead.

## Layout

```
main.go              schema applied + seeded on startup, then HTTP
schema.sql           embedded into the binary
internal/api/        ServeMux routing (Go 1.22 method patterns), handlers, CORS
internal/config/     env → Config
internal/security/   credential validation, bcrypt, HS256 JWT
internal/store/      Store interface, PostgreSQL impl, idempotent seed
```

Routing and middleware are hand-rolled `http.Handler` wrappers — the same shape as the
Selenoid hub, so the framework tax is visible next to the Gin twin.
