# Tests

Automation outside backend unit / frontend RTL — by **language** → **stack dimensions**.

Full naming canon: **[NAMING.md](NAMING.md)**  
Pattern: `tests_{lang}_{build}_{framework}_{reporting}_{automation}`

```
tests/
  java/
    tests_java_gradle_junit5_allure3_selenide/   # active
    # planned: …_junit4_…, …_testng_…, …_no-allure_…, maven_…
  javascript/
    tests_javascript_playwright/                   # → npm_playwright_no-allure (block 2+)
  python/
    tests_python_selenium/                         # → pip_pytest_… (block 2+)
  _deferred/
```

| Kind | Where |
|------|-------|
| Backend unit | `backend/java/backend_java_spring/src/test/` |
| RTL component | `frontend/typescript/frontend_typescript_react-testing-library/` |
| Browser/api/e2e | `tests/java/tests_java_gradle_junit5_allure3_selenide/` |

Block 2: one `test.yml`; add jobs incrementally.
