# Python backend CI verbs

Same job names as teaching `ci.yml` (`backend-unit-tests` · `integration-tests` ·
`sonar-backend`). Implementations live here because GitHub does not interpolate
`uses:`.

Teaching adapter (`backend/.github/actions/<verb>`) stays on
`backend-java-spring`. To teach a Python module, point those adapters here and
flip `BACKEND_LANG` / `BACKEND_FRAMEWORK`.

Sibling workflow [`.github/workflows/backend_python_github.yml`](../../../.github/workflows/backend_python_github.yml)
runs flask / fastapi / django on a matrix (unique artifact names per module).
