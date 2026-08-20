# backend-kotlin-spring

Kotlin Spring Boot JSON API — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `multistack_app_kotlin_spring`.

**Status:** active.

```
https://autotests.ai/stack/backend-kotlin-spring/{frontend}/
https://autotests.ai/stack/backend-kotlin-spring/api/
```

Unit tests: `src/test/kotlin/` (`./gradlew test -DexcludeTags=integration`).  
Classical **integration** is `src/test/kotlin/dev/multistack/app/integration/` (`@SpringBootTest` + Testcontainers PG) — CI job `integration-tests`.  
Run: `./gradlew check`
