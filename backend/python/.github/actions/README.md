# Python backend CI verbs

Same job names as `ci.yml` (`backend-unit-tests` · `integration-tests` ·
`sonar-backend`). Implementations live here because GitHub does not interpolate
`uses:`.

`backend/.github/actions/<verb>` dispatches here when `BACKEND_LANG=python`.
Set `BACKEND_FRAMEWORK` to `flask` / `fastapi` / `django`.
