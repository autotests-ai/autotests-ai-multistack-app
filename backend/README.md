# Backend

Server-side code by **language** → **stack** (`_` between segments).

```
backend/
  java/
    backend_java_spring/    # Spring Boot 21 + Postgres + Flyway — JSON API only
    # future: backend_kotlin_spring, backend_java_quarkus
  scripts/                  # CI helpers (Sonar, env profiles)
```

Product UI SSOT is `frontend/`, served by `deploy/web` (nginx). Backend does not host HTML/JS.

**Unit tests** live inside each backend module:  
`backend/java/backend_java_spring/src/test/java/` — JaCoCo gate, `./gradlew test`.

Integration / e2e / api slices → `tests/java/tests_java_gradle_junit5_allure3_selenide/`.
