# SSOT path constants for reference-app-copy (source from scripts that need them).
#
# Naming: tests-{lang}-{build}-{framework}-{reporting}-{automation}
#   - between segments; _ only in compounds (no_allure, react_testing_library).
# See tests/NAMING.md / frontend/README.md for the full matrix.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BACKEND_JAVA_SPRING="$REPO_ROOT/backend/java/backend-java-spring"

# Shared / catalog (not product URL matrix)
FRONTEND_JS_EMBED="$REPO_ROOT/frontend/_shared/frontend-javascript-embed"
FRONTEND_JS_APP="$REPO_ROOT/frontend/_shared/frontend-javascript-app"
FRONTEND_REACT_UI="$REPO_ROOT/frontend/_shared/frontend-react-ui"
FRONTEND_JS_PREVIEW="$REPO_ROOT/frontend/_catalog/frontend-javascript-preview"

# Product frontends — javascript
FRONTEND_JS_VANILLA="$REPO_ROOT/frontend/javascript/frontend-javascript-vanilla"
FRONTEND_JS_REACT="$REPO_ROOT/frontend/javascript/frontend-javascript-react"
FRONTEND_JS_ANGULAR="$REPO_ROOT/frontend/javascript/frontend-javascript-angular"
FRONTEND_JS_VUE="$REPO_ROOT/frontend/javascript/frontend-javascript-vue"
# Component tests (jsdom) live in product module: $FRONTEND_JS_REACT/src/test/

# Product frontends — typescript
FRONTEND_TS_REACT="$REPO_ROOT/frontend/typescript/frontend-typescript-react"
FRONTEND_TS_ANGULAR="$REPO_ROOT/frontend/typescript/frontend-typescript-angular"
FRONTEND_TS_VUE="$REPO_ROOT/frontend/typescript/frontend-typescript-vue"
# Component tests (jsdom) live in product module: $FRONTEND_TS_REACT/src/test/ (component_rtl)
FRONTEND_TS_VANILLA="$REPO_ROOT/frontend/typescript/frontend-typescript-vanilla"

# Active Java automation module (Gradle · JUnit 5 · Allure 3 · Selenide)
TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE="$REPO_ROOT/tests/java/tests-java-gradle-junit5-allure3-selenide"
TESTS_JAVA="$TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE"

TESTS_JS_PLAYWRIGHT="$REPO_ROOT/tests/javascript/tests-javascript-playwright"
TESTS_PYTHON_SELENIUM="$REPO_ROOT/tests/python/tests-python-selenium"

MONOREPO_ROOT="$(cd "$REPO_ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
