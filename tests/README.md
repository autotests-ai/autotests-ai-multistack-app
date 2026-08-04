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
    tests-javascript-playwright/
  python/
    tests-python-selenium/
  _deferred/
```

| Kind | Job id | Where |
|------|--------|-------|
| Product unit | `unit_backend` | `backend/java/backend-java-spring/src/test/` |
| Test-infra unit | `unit_test-infra` | `…/tests/unit/testinfra/` · `@Layer("unit")` + `@Tag("test-infra")` |
| RTL | `component_rtl` | `frontend/typescript/react/frontend-typescript-react_testing_library/` |
| Browser/api/e2e | `api` … `e2e` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

CI: [`.github/workflows/test.yml`](../.github/workflows/test.yml) — flip `if: false` per phase.
