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
| Product unit | `unit_backend` | `backend/java/backend-java-spring/src/test/` |
| Test-infra | `test-infra` | `…/tests/testinfra/` · `@Layer("test-infra")` + `@Tag("test-infra")` |
| RTL | `component_rtl` | `frontend/typescript/frontend-typescript-react/src/test/` |
| Browser/api/e2e | `api` … `e2e` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

CI: [`.github/workflows/test.yml`](../.github/workflows/test.yml) — flip `if: false` per phase.
