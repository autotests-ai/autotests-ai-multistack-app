# Test module naming (SSOT)

Folder name = stacked dimensions, **`-` between segments**, **`_` only in compound tokens** (`no_allure`, `react_testing_library`).

## Pattern

```
tests-{language}-{build}-{framework}-{reporting}-{automation}
```

| Segment | Examples | Notes |
|---------|----------|-------|
| `language` | `java`, `kotlin`, `javascript`, `typescript`, `python`, `go` | top-level under `tests/` |
| `build` | `gradle`, `maven`, `npm`, `pip`, `mod` | omit when obvious (e.g. JS → npm) |
| `framework` | `junit4`, `junit5`, `junit6`, `testng`, `pytest`, `vitest`, `testing` | test runner |
| `reporting` | `allure2`, `allure3`, `no_allure` | underscore in `no_allure` |
| `automation` | `selenium`, `selenide`, `playwright`, `cypress`, `none` | browser/UI driver; `none` for api-only |

## Java (Gradle) — matrix

| Folder | Status |
|--------|--------|
| `tests-java-gradle-junit5-allure3-selenide` | **active** — block 2 CI target |
| `tests-java-gradle-junit5-allure3-selenium` | planned |
| `tests-java-gradle-junit5-allure2-selenide` | planned |
| `tests-java-gradle-junit5-no_allure-selenide` | planned |
| `tests-java-gradle-junit4-allure2-selenium` | planned |
| `tests-java-gradle-testng-allure3-selenium` | planned |
| `tests-java-maven-junit5-allure3-selenide` | planned |

Only one module is runnable per app fork; others are teaching slots / generator outputs.

## JavaScript / TypeScript / Python / Go / Kotlin

Living folders may shorten when dimensions are obvious (`tests-javascript-playwright`).
Full IDs live in [`deploy/matrix.yaml`](../deploy/matrix.yaml) (`status: active|slot`).

| Folder / id | Status |
|-------------|--------|
| `tests-javascript-playwright` | **active** |
| `tests-javascript-cypress` | slot |
| `tests-typescript-playwright` | slot |
| `tests-python-selenium` | **active** |
| `tests-python-playwright` | slot |
| `tests-kotlin-gradle-junit5-allure3-selenide` | slot |
| `tests-go-testing-allure3` | slot (selenoid-tests language) |

```
tests-javascript-npm-playwright-no_allure
tests-javascript-npm-jest-no_allure
tests-typescript-npm-playwright-allure3
tests-python-pip-pytest-allure3-selenium
tests-python-pip-pytest-no_allure-playwright
tests-go-mod-testing-allure3
```

## Related zones

| Kind | Path | Not in `tests/` |
|------|------|----------------|
| Backend unit | `backend/java/backend-java-spring/src/test/` | JaCoCo gate |
| RTL (TS React) | `frontend/typescript/frontend-typescript-react/src/test/` | Vitest + RTL |
| RTL (JS React) | `frontend/javascript/frontend-javascript-react/src/test/` | Vitest + RTL (slot) |
| Angular (slot) | `frontend/<lang>/frontend-*-angular/` (+ `src/test/`) | component tests TBD |
| Vue (slot) | `frontend/<lang>/frontend-*-vue/` (+ `src/test/`) | component tests TBD |
| Product UI | `frontend/<lang>/frontend-*` | served under `/{frontend}/` |

Paths SSOT: `backend/scripts/paths.sh` · layout: [frontend/README.md](../frontend/README.md)
