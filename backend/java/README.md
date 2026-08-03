# Java backends

| Folder | Stack |
|--------|-------|
| `backend_java_spring/` | Spring Boot 3 · Gradle · Postgres · JWT |

Unit tests: `src/test/java/` (same module).  
Run: `cd backend_java_spring && ./gradlew test`

Package layout (canon, same as `stacks/java-spring` / `reference-app`):

```
dev.reference.app/
  ReferenceApplication.java
  config/ controller/ dto/ entity/ exception/ repository/ service/
```

**Universal UI host:** `PageController` soft-routes `/{page}` (no dots) as:
- `static/{page}.html` if present (MPA / vanilla)
- else `index.html` (SPA / React / Angular client router)

Tests and nav use `/login` and `/register`, not `*.html`. API is only `/api/**` (+ CORS for other origins).

UI source: `frontend/` (not under this module). Compose `UI_MODULE` (+ optional `UI_RUNTIME`) packs
the built static tree into the image. Local `./gradlew bootRun` is API-focused unless you pack UI.
Catalog: `frontend/_catalog`.

Future: `backend_kotlin_spring/`, etc.
