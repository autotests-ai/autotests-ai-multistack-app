# Java tests

| Folder | Runner |
|--------|--------|
| `tests-java-gradle/` | Gradle · Selenide · Rest Assured · `@Layer` pyramid |

```bash
cd tests-java-gradle
./gradlew testUnit -DpyramidStand=reference_ci
./gradlew testE2e -Denv=reference_ci_e2e
```

Env profiles: `src/test/resources/config/` · regenerate: `backend/scripts/gen-env-configs.py`

Future slots: `tests-java-testng/`, etc.
