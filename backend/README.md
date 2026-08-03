# Backend

Server-side code by **language** → **stack**.

```
backend/
  java/
    backend-java-spring/    # Spring Boot 21 + Postgres + Flyway
    # future: backend-kotlin-spring, backend-java-quarkus
  scripts/                  # cross-stack build: sync static, wire-ui, env profiles
```

**Unit tests** live inside each backend module:  
`backend/java/backend-java-spring/src/test/java/` — JaCoCo gate, `./gradlew test`.

Integration / e2e / api pyramid slices → `tests/java/tests-java-gradle/`.
