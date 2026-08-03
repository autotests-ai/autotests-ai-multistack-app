# Backend

Server-side code by **language** → **stack** (`_` between segments).

```
backend/
  java/
    backend_java_spring/    # Spring Boot 21 + Postgres + Flyway
    # future: backend_kotlin_spring, backend_java_quarkus
  scripts/                  # cross-stack build: sync static, wire-ui, env profiles
```

**Unit tests** live inside each backend module:  
`backend/java/backend_java_spring/src/test/java/` — JaCoCo gate, `./gradlew test`.

Integration / e2e / api slices → `tests/java/tests_java_gradle_junit5_allure3_selenide/`.
