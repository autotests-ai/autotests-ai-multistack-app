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

Public auth URLs: `/login` and `/register` (`PageController` forwards to static `*.html`). Tests and nav must not use `/login.html`.

`src/main/resources/static/` is **generated** (gitignored). SSOT is `frontend/` — run `backend/scripts/sync-app-static.sh` before local `./gradlew bootRun`, or build via Docker (sync runs in the image). Catalog stays in `frontend/_catalog`.

Future: `backend_kotlin_spring/`, etc.
