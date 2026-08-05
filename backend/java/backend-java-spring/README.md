# backend-java-spring

Spring Boot JSON API — **reference implementation** of the contract every other backend mirrors.
Postgres DB: `reference_app_java_spring`.

**Status:** active.

```
https://reference-app-copy.autotests.ai/backend-java-spring/{frontend}/
https://reference-app-copy.autotests.ai/backend-java-spring/api/
```

Unit tests: `src/test/java/`.
Run: `./gradlew check` (JaCoCo gate: 100% line coverage).

## Contract

`service` in `/api/health` equals this module id and must match `health_service` in
[`deploy/matrix.yaml`](../../../deploy/matrix.yaml).

| Method | Path | Auth | Success | Body |
|--------|------|------|---------|------|
| GET | `/api/health` | — | 200 | `{"status":"ok","service":"backend-java-spring"}` |
| GET | `/api/items` | — | 200 | `{"items":[{"id","name","description"}],"source":"postgresql"}` |
| POST | `/api/auth/register` | — | 201 | `{"token","username","redirectUrl":"/"}` |
| POST | `/api/auth/login` | — | 200 | `{"token","username","redirectUrl":"/"}` |
| POST | `/api/auth/logout` | — | 204 | empty |
| GET | `/api/auth/me` | Bearer | 200 | `{"username"}` |

Errors are always `{"message": "..."}`:

| Status | When | Message |
|--------|------|---------|
| 400 | credentials fail validation | field-specific |
| 401 | bad credentials / missing-invalid token | `Wrong login or password` · `Unauthorized` |
| 409 | username already exists | `Username already taken` |

Validation: `username` 3–64 chars, `password` 6–128 chars.
`/api/items` is ordered by `id`; `register` maps a lost unique-constraint race to 409.

Seed: user `user1` / `password1`, plus 3 items from Flyway `V1__items.sql`.

## Layout

```
dev.reference.app/
  ReferenceApplication.java
  config/ controller/ dto/ entity/ exception/ repository/ service/
```

**API-only.** Controllers expose `/api/**`; UI lives in `frontend/*` nginx containers.
CSRF is disabled by design — auth is stateless Bearer JWT, no ambient cookie credential.

Kotlin twin: [`../../kotlin/backend-kotlin-spring/`](../../kotlin/backend-kotlin-spring/).
