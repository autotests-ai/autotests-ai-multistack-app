# backend-go-gin

Go [Gin](https://github.com/gin-gonic/gin) JSON API — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_go_gin`.

**Status:** active.

```
https://reference-app-copy.autotests.ai/backend-go-gin/{frontend}/
https://reference-app-copy.autotests.ai/backend-go-gin/api/
```

Unit tests: `internal/**/*_test.go`.  
Run: `go test ./...` (no database needed — handlers talk to the `store.Store` interface).

The PostgreSQL tests in `internal/store/postgres_integration_test.go` skip unless a scratch
database is given:

```
TEST_DATABASE_URL=postgres://reference:reference@localhost:5432/scratch?sslmode=disable go test ./...
```

Why Gin (not Echo/Chi/Fiber): most common course/tutorial stack for REST + middleware; still thin over `net/http`.  
Sibling without framework: [`backend-go-stdlib`](../backend-go-stdlib/) (Selenoid-style).

## Layout

```
main.go              schema applied + seeded on startup, then HTTP
schema.sql           embedded into the binary
internal/api/        Gin router, handlers, CORS
internal/config/     env → Config
internal/security/   credential validation, bcrypt, HS256 JWT
internal/store/      Store interface, PostgreSQL impl, idempotent seed
```
