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

`src/main/resources/static/` is a **lean** materialization (`backend/scripts/sync-app-static.sh`): app pages + required header/CSS only. Full design-system catalog lives under `frontend/` (`_shared`, `_catalog`).

Future: `backend_kotlin_spring/`, etc.
