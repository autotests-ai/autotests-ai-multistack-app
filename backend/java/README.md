# Java backends

| Folder | Stack |
|--------|-------|
| `backend-java-spring/` | Spring Boot 3 · Gradle · Postgres · JWT |

Unit tests: `src/test/java/` (same module).  
Run: `cd backend-java-spring && ./gradlew test`

Package layout (canon, same as ethalon `backend/java/backend-java-spring`):

```
dev.multistack.app/
  MultistackApplication.java
  config/ controller/ dto/ entity/ exception/ repository/ service/
```

**API-only.** Controllers expose `/api/**`. UI lives in `frontend/*` containers
(host nginx: `/{backend}/{frontend}/` → frontend port, `/{backend}/api/` → this service).

Kotlin twin: [`../kotlin/backend-kotlin-spring/`](../kotlin/backend-kotlin-spring/).
