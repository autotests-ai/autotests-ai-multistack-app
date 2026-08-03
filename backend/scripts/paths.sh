# SSOT path constants for reference-app-copy (source from backend/scripts/*.sh).
# Naming: zone_language_stack with _ separators; hyphen only in compound tool names (e.g. react-testing-library).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BACKEND_JAVA_SPRING="$REPO_ROOT/backend/java/backend_java_spring"
BACKEND_STATIC="$BACKEND_JAVA_SPRING/src/main/resources/static"

FRONTEND_JS_EMBED="$REPO_ROOT/frontend/javascript/frontend_javascript_embed"
FRONTEND_JS_STATIC="$REPO_ROOT/frontend/javascript/frontend_javascript_static"
FRONTEND_JS_PREVIEW="$REPO_ROOT/frontend/javascript/frontend_javascript_preview"
FRONTEND_TS_RTL="$REPO_ROOT/frontend/typescript/frontend_typescript_react-testing-library"

TESTS_JAVA_GRADLE="$REPO_ROOT/tests/java/tests_java_gradle"
TESTS_JS_PLAYWRIGHT="$REPO_ROOT/tests/javascript/tests_javascript_playwright"
TESTS_PYTHON_SELENIUM="$REPO_ROOT/tests/python/tests_python_selenium"

MONOREPO_ROOT="$(cd "$REPO_ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
