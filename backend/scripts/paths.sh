# SSOT path constants for reference-app-copy (source from backend/scripts/*.sh).
#
# Naming: tests_{lang}_{build}_{framework}_{reporting}_{automation}
#   _ between segments; - only in compounds (no-allure, react-testing-library).
# See tests/NAMING.md / frontend/README.md for the full matrix.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BACKEND_JAVA_SPRING="$REPO_ROOT/backend/java/backend_java_spring"
BACKEND_STATIC="$BACKEND_JAVA_SPRING/src/main/resources/static"

# Shared / catalog (not product URL matrix)
FRONTEND_JS_EMBED="$REPO_ROOT/frontend/_shared/frontend_javascript_embed"
FRONTEND_JS_PREVIEW="$REPO_ROOT/frontend/_catalog/frontend_javascript_preview"

# Product frontends — javascript
FRONTEND_JS_VANILLA="$REPO_ROOT/frontend/javascript/vanilla/frontend_javascript_vanilla"
FRONTEND_JS_REACT="$REPO_ROOT/frontend/javascript/react/frontend_javascript_react"
FRONTEND_JS_RTL="$REPO_ROOT/frontend/javascript/react/tests_javascript_react-testing-library"

# Product frontends — typescript
FRONTEND_TS_REACT="$REPO_ROOT/frontend/typescript/react/frontend_typescript_react"
FRONTEND_TS_RTL="$REPO_ROOT/frontend/typescript/react/tests_typescript_react-testing-library"
FRONTEND_TS_VANILLA="$REPO_ROOT/frontend/typescript/vanilla/frontend_typescript_vanilla"

# Compat alias: sync-app-static still materializes the vanilla product UI
FRONTEND_JS_STATIC="$FRONTEND_JS_VANILLA"

# Active Java automation module (Gradle · JUnit 5 · Allure 3 · Selenide)
TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE="$REPO_ROOT/tests/java/tests_java_gradle_junit5_allure3_selenide"
TESTS_JAVA="$TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE"

TESTS_JS_PLAYWRIGHT="$REPO_ROOT/tests/javascript/tests_javascript_playwright"
TESTS_PYTHON_SELENIUM="$REPO_ROOT/tests/python/tests_python_selenium"

MONOREPO_ROOT="$(cd "$REPO_ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
