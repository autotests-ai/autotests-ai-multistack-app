# backend-rust-axum

[Rust Axum](https://github.com/tokio-rs/axum) JSON API — same OpenAPI contract as [`backend-java-spring`](../../java/backend-java-spring/).  
Postgres DB: `multistack_app_rust_axum`.

**Status:** active.

```
https://autotests.ai/stack/backend-rust-axum/{frontend}/
https://autotests.ai/stack/backend-rust-axum/api/
```

Unit tests: `cargo test` (no database needed — handlers use an in-memory `FakeStore`).  
Integration tests skip unless `TEST_DATABASE_URL` points at a scratch database.

Coverage (unit / FakeStore, no live Postgres):

```bash
./cover.sh   # cargo llvm-cov --lib → coverage.lcov; fail-under 80% line
```

CI `sonar-backend` (when `BACKEND_LANG=rust`) reads `coverage.lcov` via [`sonar-project.properties`](sonar-project.properties)
(`projectKey` `autotests-ai-multistack-app-backend-rust-axum`, gate `qa-guru-canon`).
Default clone CI stays Java Spring.

Why Axum (not Actix): Tokio-native course stack for async REST; one sibling school per matrix slot.

## Layout

```
src/main.rs           schema applied + seeded on startup, then HTTP
schema.sql            applied on startup
resources/openapi.yaml + openapi-docs.html — module copy of _contract/
src/api/              router, handlers, CORS
src/config.rs         env → Config
src/security/         credential validation, bcrypt, HS256 JWT
src/store/            Store trait, PostgreSQL impl, idempotent seed
```
