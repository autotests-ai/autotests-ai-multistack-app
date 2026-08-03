# Java tests

| Folder | Runner |
|--------|--------|
| `tests_java_gradle/` | Gradle · Selenide · Rest Assured · `@Layer` slices |

```bash
cd tests/java/tests_java_gradle
./gradlew testUnit -DpyramidStand=reference_ci
./gradlew testE2e -Denv=reference_ci_e2e
```

Env profiles: `src/test/resources/config/` · regenerate: `backend/scripts/gen-env-configs.py`

Future: `tests_java_testng/`, etc.
