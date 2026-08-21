# Kotlin Spring backend CI verbs

Same job names as `ci.yml` (`backend-unit-tests` · `integration-tests` ·
`sonar-backend` · `build-backend` · `deploy-backend` / `deploy-backend-stage`).
Implementations live here because GitHub does not interpolate `uses:`.

`backend/.github/actions/<verb>` dispatches here when `BACKEND_LANG=kotlin`.
Docker `build` / `deploy` take `module_dir` (context = this folder, service
name = basename). Flattened takeaway leaf paths are resolved by
`.github/actions/resolve-module-dir`.
