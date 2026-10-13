# Backend

Server-side code by **language** → **stack** (`-` between segments).

```
backend/
  java/
    backend-java-spring/       # Spring Boot 21 + Postgres + Flyway — JSON API (active)
    backend-java-quarkus/      # Quarkus + Postgres — JSON API (slot)
    backend-java-micronaut/    # Micronaut + Postgres — JSON API (slot)
  kotlin/
    backend-kotlin-spring/     # Spring Boot Kotlin + Postgres + Flyway — JSON API (active)
    backend-kotlin-ktor/       # Ktor + Postgres — JSON API (active)
  python/
    backend-python-flask/      # Flask + Postgres — JSON API (active)
    backend-python-fastapi/    # FastAPI + Postgres — JSON API (active)
    backend-python-django/     # Django + Postgres — JSON API (active)
    backend-python-aiohttp/    # aiohttp + Postgres — JSON API (slot)
  go/
    backend-go-gin/            # Gin + Postgres — JSON API (active)
    backend-go-stdlib/         # net/http — Selenoid-style, no framework (active)
    backend-go-echo/           # Echo + Postgres — JSON API (slot)
  javascript/
    backend-javascript-express/  # Express + Postgres — JSON API (active)
    backend-javascript-nest/     # NestJS in JS + Postgres — JSON API (active)
    backend-javascript-fastify/  # Fastify + Postgres — JSON API (slot)
  typescript/
    backend-typescript-express/  # Express + TS + Postgres — JSON API (active)
    backend-typescript-nest/     # NestJS + TS + Postgres — JSON API (active)
    backend-typescript-fastify/  # Fastify + TS + Postgres — JSON API (slot)
  csharp/
    backend-csharp-aspnet/        # ASP.NET Core + Postgres — JSON API (active)
    backend-csharp-minimal/       # ASP.NET Core Minimal API + Postgres — JSON API (slot)
  rust/
    backend-rust-axum/            # Axum + Postgres — JSON API (active)
    backend-rust-actix/           # Actix Web + Postgres — JSON API (slot)
  php/
    backend-php-laravel/          # Laravel + Postgres — JSON API (slot)
    backend-php-slim/             # Slim + Postgres — JSON API (slot)
  ruby/
    backend-ruby-rails/           # Rails api_only + Postgres — JSON API (slot)
    backend-ruby-sinatra/         # Sinatra + Postgres — JSON API (slot)
  scala/
    backend-scala-play/           # Play + Postgres — JSON API (slot)
    backend-scala-http4s/         # http4s + Postgres — JSON API (slot)
  elixir/
    backend-elixir-phoenix/       # Phoenix API-only + Postgres — JSON API (slot)
  dart/
    backend-dart-shelf/           # shelf + Postgres — JSON API (slot)
  scripts/                     # CI helpers (Sonar, env profiles, paths.sh)
```

Product UI SSOT is `frontend/` — each active module has its own nginx container (see root `docker-compose.yml`).  
Host nginx: **`/{backend}/api` → this API**, **`/{backend}/{frontend}` → that frontend’s publish port**.  
Matrix: [`deploy/matrix.yaml`](../deploy/matrix.yaml).

### Publish ports (local = prod host)

Language base **+10**, stack **+1** from **8800** — see root [README](../README.md#ports-local--prod-host-upstream).

| Port | Module |
|------|--------|
| 8800 | `backend-java-spring` |
| 8801–8802 | java quarkus / micronaut (slots) |
| 8810 | `backend-kotlin-spring` |
| 8811 | `backend-kotlin-ktor` |
| 8820–8822 | python flask / fastapi / django |
| 8823 | `backend-python-aiohttp` (slot) |
| 8830–8831 | go gin / stdlib |
| 8832 | `backend-go-echo` (slot) |
| 8840–8841 | javascript express / nest |
| 8842 | `backend-javascript-fastify` (slot) |
| 8850–8851 | typescript express / nest |
| 8852 | `backend-typescript-fastify` (slot) |
| 8860 | `backend-csharp-aspnet` |
| 8861 | `backend-csharp-minimal` (slot) |
| 8870 | `backend-rust-axum` |
| 8871 | `backend-rust-actix` (slot) |
| 8880–8881 | php laravel / slim (slots) |
| 8890–8891 | ruby rails / sinatra (slots) |
| 8900–8901 | scala play / http4s (slots) |
| 8910 | `backend-elixir-phoenix` (slot) |
| 8920 | `backend-dart-shelf` (slot) |

Container listen stays `:8080`. Backend does not host HTML/JS.

All **active** modules answer the **same JSON contract** — documented in
[`backend-java-spring/README.md`](java/backend-java-spring/README.md), which is the reference
implementation. `service` in `GET /api/health` equals the module id and must match
`health_service` in [`deploy/matrix.yaml`](../deploy/matrix.yaml).

**Unit tests** live inside each backend module:  
`backend/java/backend-java-spring/src/test/java/` — JaCoCo gate, `./gradlew test`.  
`backend/kotlin/backend-kotlin-spring/src/test/kotlin/` — JaCoCo gate, `./gradlew test`.  
`backend/python/backend-python-*/tests/` — `python -m pytest`.  
`backend/go/backend-go-*/` — `go test ./...`.  
`backend/rust/backend-rust-axum/` — `cargo test`.  
`backend/csharp/backend-csharp-aspnet/` — `dotnet test` (Coverlet).  
`backend/{javascript,typescript}/backend-*/` — `npm test`.

Integration / e2e / api slices → `tests/java/tests-java-junit5-rest_assured-selenide/`.
The api layer targets one backend at a time: `-DapiBaseUrl=http://localhost:8830/ -DapiHealthService=backend-go-gin`.
