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

Future: `backend_kotlin_spring/`, etc.
