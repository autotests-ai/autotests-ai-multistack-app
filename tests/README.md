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
| Test-infra | `test-infra-tests` | `…/tests/testinfra/` · `@Layer("test-infra")` + `@Tag("test-infra")` |
| RTL | `component-tests` | `frontend/typescript/frontend-typescript-react/src/test/` |
| Browser/api/e2e | `api-tests` + dispatch | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

The Java module has one Gradle task — `test`. The layer is a tag filter, the stand is `-Denv`:

```bash
./gradlew test -Denv=reference_ci -DincludeTags=test-infra
./gradlew test -Denv=reference_prod -DincludeTags=smoke -DexcludeTags=visual
```
