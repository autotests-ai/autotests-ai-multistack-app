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
  typescript/
    tests-typescript-playwright/                 # active
  kotlin/ · go/                                  # slots in deploy/matrix.yaml
  _deferred/
```

| Kind | Job id | Where |
|------|--------|-------|
| Product unit | `backend-unit-tests` | `backend/java/backend-java-spring/src/test/` |
| Infra | `infra-tests` | `…/tests/infra/` · `@Tag("infra")`; backend-only lane → `infra-backend` (`ConfigReader`) |
| RTL | `frontend-unit-tests` | `frontend/typescript/frontend-typescript-react/src/test/` |
| integration / api / e2e / manual | `integration-tests` · `api-tests` / `api-tests-stage` · `ui-mock-tests` · `e2e-tests` / `e2e-tests-stage` / `manual-tests` | `backend/java/…/integration/` · `tests/api/` · `tests/e2e/` · manual stubs **in code** (`tests/manual/`) |

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

The Java module has one Gradle task — `test`. The layer is a tag filter, the stand is `-Denv`:

```bash
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=infra-backend
./gradlew test -Denv=mock -DincludeTags=mock
./gradlew test -Denv=mock -DincludeTags=screenshot
./gradlew test -Denv=stage -DincludeTags=e2e -DexcludeTags=screenshot,mock
./gradlew test -Denv=prod -DincludeTags=e2e -DexcludeTags=screenshot,mock
```

Screenshot tests are two Selenide stages (`screenshots/{mock|e2e}/{os}/{chrome-148}/…`), not a pyramid layer — see [LAYERS.md](LAYERS.md).
