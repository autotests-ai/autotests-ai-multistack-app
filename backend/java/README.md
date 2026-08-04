# Java backends

| Folder | Stack |
|--------|-------|
| `backend-java-spring/` | Spring Boot 3 · Gradle · Postgres · JWT |

Unit tests: `src/test/java/` (same module).  
Run: `cd backend-java-spring && ./gradlew test`

Package layout (canon, same as `stacks/java-spring` / `reference-app`):

```
dev.reference.app/
  ReferenceApplication.java
  config/ controller/ dto/ entity/ exception/ repository/ service/
```

**API-only.** Controllers expose `/api/**`. UI is not in this module — `deploy/web` (nginx)
serves `frontend/` and proxies `/api` here. Soft routes `/login` / `/register` live in nginx.

Future: `backend-kotlin-spring/`, etc.
