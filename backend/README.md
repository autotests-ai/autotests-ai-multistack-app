# Backend

Server-side code by **language** → **stack** (`-` between segments).

```
backend/
  java/
    backend-java-spring/    # Spring Boot 21 + Postgres + Flyway — JSON API only
    # future: backend-kotlin-spring, backend-java-quarkus
  scripts/                  # CI helpers (Sonar, env profiles)
```

Product UI SSOT is `frontend/`, served by `deploy/web` (nginx). Backend does not host HTML/JS.

**Unit tests** live inside each backend module:  
`backend/java/backend-java-spring/src/test/java/` — JaCoCo gate, `./gradlew test`.

Integration / e2e / api slices → `tests/java/tests-java-gradle-junit5-allure3-selenide/`.
