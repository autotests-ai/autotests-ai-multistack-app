# Tests

Automated checks outside backend unit tests — by **language** → **runner/framework**.

```
tests/
  java/
    tests-java-gradle/              # pyramid: api, e2e, component, visual (Selenide)
  javascript/
    tests-javascript-playwright/    # Playwright UI smoke
  python/
    tests-python-selenium/          # pytest + Selenium page objects
  _deferred/                        # block 2+ — not wired in CI yet
```

**Unit tests ≠ this tree.** Backend unit tests stay in `backend/java/backend-java-spring/src/test/`.

Block 2 plan: **one** CI workflow; add pyramid layers inside it incrementally.
