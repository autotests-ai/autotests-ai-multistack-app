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

Public auth URLs: `/login` and `/register` (`PageController` forwards to `login.html` / `register.html` packed into the image). Tests and nav must not use `/login.html`.

UI source: `frontend/` (not under this module). `docker compose build` packs whichever module
compose sets as `UI_MODULE` (+ `UI_RUNTIME`) into the image — see root `docker-compose.yml`.
Local `./gradlew bootRun` is API-focused unless you pack UI yourself. Catalog: `frontend/_catalog`.

Future: `backend_kotlin_spring/`, etc.
