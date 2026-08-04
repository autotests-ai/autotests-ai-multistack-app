# Backend

Server-side code by **language** → **stack** (`-` between segments).

```
backend/
  java/
    backend-java-spring/       # Spring Boot 21 + Postgres + Flyway — JSON API (active)
  kotlin/
    backend-kotlin-spring/     # Spring Boot Kotlin + Postgres + Flyway — JSON API (active)
  python/
    backend-python-flask/      # Flask + Postgres — JSON API (active)
    backend-python-fastapi/    # FastAPI + Postgres — JSON API (active)
    backend-python-django/     # Django + Postgres — JSON API (active)
  go/
    backend-go-gin/            # slot (Gin — product REST)
    backend-go-stdlib/         # slot (net/http — Selenoid-style)
  javascript/
    backend-javascript-express/  # slot (Express — intro REST on Node)
  typescript/
    backend-typescript-nest/     # slot (NestJS — TypeScript product on Node)
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
| 8810 | `backend-kotlin-spring` |
| 8820–8822 | python flask / fastapi / django |
| 8830–8831 | go gin / stdlib |
| 8840 | `backend-javascript-express` |
| 8850 | `backend-typescript-nest` |

Container listen stays `:8080`. Backend does not host HTML/JS.

**Unit tests** live inside each backend module:  
`backend/java/backend-java-spring/src/test/java/` — JaCoCo gate, `./gradlew test`.  
`backend/python/backend-python-*/tests/` — `python -m pytest`.

Integration / e2e / api slices → `tests/java/tests-java-gradle-junit5-allure3-selenide/`.
