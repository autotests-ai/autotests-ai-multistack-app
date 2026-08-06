# Tests

Automation outside backend unit / frontend RTL — by **language** → **stack dimensions**.

| Doc | Role |
|-----|------|
| **[LAYERS.md](LAYERS.md)** | Pyramid layers → paths → Gradle/npm → CI jobs |
| **[NAMING.md](NAMING.md)** | Module folder pattern `tests_{lang}_{build}_{framework}_{reporting}_{automation}` |

```
tests/
  java/
    tests-java-gradle-junit5-allure3-selenide/   # active
  javascript/
    tests-javascript-playwright/                 # active
  python/
    tests-python-selenium/                       # active
  typescript/ · kotlin/ · go/                    # slots in deploy/matrix.yaml
  _deferred/
```

| Kind | Job id | Where |
|------|--------|-------|
| Product unit | `unit-tests` | `backend/java/backend-java-spring/src/test/` |
| Harness | `tests-harness` | `…/tests/testinfra/` · `@Layer("harness")` + `@Tag("harness")` — not a pyramid layer |
| RTL | `component-tests` | `frontend/typescript/frontend-typescript-react/src/test/` |
| integration / e2e | `integration-tests` · `e2e-smoke` · dispatch `e2e-tests` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

The Java module has one Gradle task — `test`. The layer is a tag filter, the stand is `-Denv`:

```bash
./gradlew test -Denv=reference_ci -DincludeTags=harness
./gradlew test -Denv=reference_prod -DincludeTags=e2e -DexcludeTags=visual
```
