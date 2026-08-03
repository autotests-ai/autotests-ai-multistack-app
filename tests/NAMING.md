# Test module naming (SSOT)

Folder name = stacked dimensions, **`_` between segments**, **`-` only in compound tokens** (`no-allure`, `react-testing-library`).

## Pattern

```
tests_{language}_{build}_{framework}_{reporting}_{automation}
```

| Segment | Examples | Notes |
|---------|----------|-------|
| `language` | `java`, `javascript`, `python` | top-level under `tests/` |
| `build` | `gradle`, `maven`, `npm`, `pip` | omit when obvious (e.g. JS → npm) |
| `framework` | `junit4`, `junit5`, `junit6`, `testng`, `pytest`, `vitest` | test runner |
| `reporting` | `allure2`, `allure3`, `no-allure` | hyphen in `no-allure` |
| `automation` | `selenium`, `selenide`, `playwright`, `none` | browser/UI driver; `none` for api-only |

## Java (Gradle) — matrix

| Folder | Status |
|--------|--------|
| `tests_java_gradle_junit5_allure3_selenide` | **active** — block 2 CI target |
| `tests_java_gradle_junit5_allure3_selenium` | planned |
| `tests_java_gradle_junit5_allure2_selenide` | planned |
| `tests_java_gradle_junit5_no-allure_selenide` | planned |
| `tests_java_gradle_junit4_allure2_selenium` | planned |
| `tests_java_gradle_testng_allure3_selenium` | planned |
| `tests_java_maven_junit5_allure3_selenide` | planned |

Only one module is runnable per app fork; others are teaching slots / generator outputs.

## JavaScript / Python (same idea)

```
tests_javascript_npm_playwright_no-allure
tests_javascript_npm_jest_no-allure
tests_python_pip_pytest_allure3_selenium
tests_python_pip_pytest_no-allure_playwright
```

## Related zones

| Kind | Path | Not in `tests/` |
|------|------|----------------|
| Backend unit | `backend/java/backend_java_spring/src/test/` | JaCoCo gate |
| RTL (TS React) | `frontend/typescript/react/tests_typescript_react-testing-library/` | Vitest + RTL |
| RTL (JS React) | `frontend/javascript/react/tests_javascript_react-testing-library/` | Vitest + RTL (slot) |
| Product UI | `frontend/<lang>/{react,vanilla}/frontend_*` | served under `/{frontend}/` |

Paths SSOT: `backend/scripts/paths.sh` · layout: [frontend/README.md](../frontend/README.md)
