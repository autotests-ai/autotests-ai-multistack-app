# SSOT path constants for reference-app-copy (source from backend/scripts/*.sh).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

BACKEND_JAVA_SPRING="$REPO_ROOT/backend/java/backend-java-spring"
BACKEND_STATIC="$BACKEND_JAVA_SPRING/src/main/resources/static"

FRONTEND_JS_EMBED="$REPO_ROOT/frontend/javascript/frontend-javascript-embed"
FRONTEND_JS_STATIC="$REPO_ROOT/frontend/javascript/frontend-javascript-static"
FRONTEND_JS_PREVIEW="$REPO_ROOT/frontend/javascript/frontend-javascript-preview"
FRONTEND_TS_REACT="$REPO_ROOT/frontend/typescript/frontend-typescript-react"

TESTS_JAVA_GRADLE="$REPO_ROOT/tests/java/tests-java-gradle"
TESTS_JS_PLAYWRIGHT="$REPO_ROOT/tests/javascript/tests-javascript-playwright"
TESTS_PYTHON_SELENIUM="$REPO_ROOT/tests/python/tests-python-selenium"

MONOREPO_ROOT="$(cd "$REPO_ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/generators/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
