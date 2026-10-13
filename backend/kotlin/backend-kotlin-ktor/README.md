# backend-kotlin-ktor

Kotlin Ktor JSON API — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Copy: [`resources/openapi.yaml`](resources/openapi.yaml)
(served from classpath as `GET /api/openapi.yaml`; Swagger UI at `GET /api/docs`).
Postgres DB: `multistack_app_kotlin_ktor`.

**Status:** active.

```
https://autotests.ai/stack/backend-kotlin-ktor/{frontend}/
https://autotests.ai/stack/backend-kotlin-ktor/api/
```

Stack notes vs `backend-kotlin-spring`: Netty + Ktor plugins instead of the servlet stack —
`Authentication`(JWT, auth0/java-jwt) for the security chain, `StatusPages` for the error
envelope, `MicrometerMetrics` on a second embedded server (`MANAGEMENT_PORT`) for
`/actuator/health` + `/actuator/prometheus`. Plain JDBC (HikariCP) + idempotent
`schema.sql` instead of JPA/Flyway; `at.favre.lib:bcrypt` instead of spring-security-crypto.

Unit tests: `src/test/kotlin/` (`./gradlew test -DexcludeTags=integration`; repositories run
against H2 in PostgreSQL mode). Classical **integration** is
`src/test/kotlin/dev/multistack/app/integration/` — same questions as Java
(`ApplicationWiring` + `AuthLifecycle` + `ActuatorPrometheus` on Testcontainers
`postgres:16-alpine`).

```bash
./gradlew test -DexcludeTags=integration
./gradlew test -DincludeTags=integration
./gradlew check
```

Coverage gate: 100% line (JaCoCo), `MultistackApplication.kt` excluded — same convention as
the sibling modules.
