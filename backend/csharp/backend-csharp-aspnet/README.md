# backend-csharp-aspnet

ASP.NET Core JSON API — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `multistack_app_csharp_aspnet`.

**Status:** active.

```
https://autotests.ai/stack/backend-csharp-aspnet/{frontend}/
https://autotests.ai/stack/backend-csharp-aspnet/api/
```

Unit tests: `tests/BackendCSharpAspnet.Tests`.  
Run: `dotnet test` (no database needed — handlers talk to the `IStore` interface).

The PostgreSQL tests in `PostgresStoreTests` return immediately unless a scratch
database is given:

```
TEST_DATABASE_URL=postgres://multistack:multistack@localhost:5432/scratch?sslmode=disable dotnet test
```

Why ASP.NET Core (not Nancy/Minimal-only samples): most common C# course/tutorial stack for REST + middleware.

## Layout

```
schema.sql                         applied + seeded on startup
src/BackendCSharpAspnet/           WebApplication, handlers, CORS, OpenAPI copy
  Config/                          env → AppConfig
  Security/                        credential validation, bcrypt, HS256 JWT
  Store/                           IStore, PostgreSQL impl, idempotent seed
  Api/                             DTOs, CORS, handlers
  Resources/                       openapi.yaml (byte-for-byte `_contract/`) + Swagger UI
tests/BackendCSharpAspnet.Tests/   unit tests against FakeStore
```

Sonar: `autotests-ai-multistack-app-backend-csharp-aspnet` / gate `qa-guru-canon`.  
Publish port **8860** (`deploy/matrix.yaml`). Container listen stays `:8080`.
