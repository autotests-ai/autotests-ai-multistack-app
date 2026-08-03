# java / gradle-junit5-selenium

UI smoke sibling of the Java Selenide pyramid ([`../../tests/`](../../tests/)).

Naming follows [qa-guru-refs](https://github.com/svasenkov) matrix cells:

`{lang}/{build}-{framework}-{driver}` → `java/gradle-junit5-selenium`

Canon SSOT stays short path [`tests/`](../../tests/) ≡ **java · gradle · junit5 · selenide** (full pyramid). This cell is Selenium smoke only — same flows as [`../../tests_python_selenium/`](../../tests_python_selenium/) (`pip-pytest-selenium` shape).

## Quick start

```bash
cd java/gradle-junit5-selenium
./gradlew test
```

Defaults:

| Key | Default |
|-----|---------|
| `baseUrl` / `BASE_URL` | `https://reference-app.autotests.ai/` |
| `browserVersion` | `148.0` (Chrome for Testing via `LocalChromePin`) |
| `headless` | `true` |

Against local compose:

```bash
./gradlew test -DbaseUrl=http://localhost:8080/
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://reference-app.autotests.ai/
export REMOTE_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
./gradlew test
```

## Allure

```bash
./gradlew test -DallureReportMode=allure3
```

## Coverage (smoke)

| Suite | Mirrors |
|-------|---------|
| `HomeTests` | tests_python_selenium `test_home` |
| `LoginTests` | tests_python_selenium `test_login` |
| `RegisterTests` | tests_python_selenium `test_register` |
| `LogoutTests` | tests_python_selenium `test_logout` |
| `HeaderActiveNavTests` | tests_python_selenium `test_header_active_nav` |
