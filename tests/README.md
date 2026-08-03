# Tests

Automation outside backend unit tests — by **language** → **runner** (`_` between segments).

```
tests/
  java/
    tests_java_gradle/              # api, e2e, component-browser (Selenide)
  javascript/
    tests_javascript_playwright/    # Playwright UI smoke
  python/
    tests_python_selenium/          # pytest + Selenium page objects
  _deferred/                        # block 2+ — not wired in CI yet
```

**Unit tests ≠ this tree.** Backend unit tests stay in `backend/java/backend_java_spring/src/test/`.  
**RTL component tests** stay in `frontend/typescript/frontend_typescript_react-testing-library/`.

Block 2: **one** `test.yml`; add layers incrementally.
