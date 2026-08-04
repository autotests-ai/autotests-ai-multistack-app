# Backend

Server-side code by **language** → **stack** (`-` between segments).

```
backend/
  java/
    backend-java-spring/       # Spring Boot 21 + Postgres + Flyway — JSON API (active)
  kotlin/
    backend-kotlin-spring/     # slot
  python/
    backend-python-flask/      # stub (/api/health) for multi-backend routing
    backend-python-fastapi/    # slot
    backend-python-django/     # slot
  go/
    backend-go-gin/            # slot (Gin)
  scripts/                     # CI helpers (Sonar, env profiles, paths.sh)
```

Product UI SSOT is `frontend/`, served by shared `deploy/web` (static nginx).  
Edge / host nginx: **subdomain → this API**, **path → shared UI**.  
Matrix: [`deploy/matrix.yaml`](../deploy/matrix.yaml).

Backend does not host HTML/JS.

**Unit tests** live inside each backend module:  
`backend/java/backend-java-spring/src/test/java/` — JaCoCo gate, `./gradlew test`.

Integration / e2e / api slices → `tests/java/tests-java-gradle-junit5-allure3-selenide/`.
