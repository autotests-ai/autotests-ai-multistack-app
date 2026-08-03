# Tests

Automation outside backend unit / frontend RTL — by **language** → **stack dimensions**.

| Doc | Role |
|-----|------|
| **[LAYERS.md](LAYERS.md)** | Pyramid layers → paths → Gradle/npm → CI jobs |
| **[NAMING.md](NAMING.md)** | Module folder pattern `tests_{lang}_{build}_{framework}_{reporting}_{automation}` |

```
tests/
  java/
    tests_java_gradle_junit5_allure3_selenide/   # active
  javascript/
    tests_javascript_playwright/
  python/
    tests_python_selenium/
  _deferred/
```

| Kind | Job id | Where |
|------|--------|-------|
| Product unit | `unit_backend` | `backend/java/backend_java_spring/src/test/` |
| Test-infra unit | `unit_test-infra` | `…/tests/unit/` in Java module |
| RTL | `component_rtl` | `frontend/typescript/frontend_typescript_react-testing-library/` |
| Browser/api/e2e | `api` … `e2e` | `tests/java/tests_java_gradle_junit5_allure3_selenide/` |

CI: [`.github/workflows/test.yml`](../.github/workflows/test.yml) — flip `if: false` per phase.
