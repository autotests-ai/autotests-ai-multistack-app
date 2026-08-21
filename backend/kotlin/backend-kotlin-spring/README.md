# backend-kotlin-spring

Kotlin Spring Boot JSON API — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Copy: [`resources/openapi.yaml`](resources/openapi.yaml)
(served from classpath as `GET /api/openapi.yaml`; Swagger UI at `GET /api/docs`).
Postgres DB: `multistack_app_kotlin_spring`.

**Status:** active.

```
https://autotests.ai/stack/backend-kotlin-spring/{frontend}/
https://autotests.ai/stack/backend-kotlin-spring/api/
```

Unit tests: `src/test/kotlin/` (`./gradlew test -DexcludeTags=integration`).
Classical **integration** is `src/test/kotlin/dev/multistack/app/integration/` —
same questions as Java (`ApplicationWiring` + `AuthLifecycle` on Testcontainers
`postgres:16-alpine`). CI job `integration-tests`.

```bash
./gradlew test -DexcludeTags=integration
./gradlew test -DincludeTags=integration
./gradlew check
```

Coverage gate: 100% line (JaCoCo). CI: `.github/workflows/ci.yml`
(`BACKEND_LANG: kotlin`, `BACKEND_FRAMEWORK: spring`).
