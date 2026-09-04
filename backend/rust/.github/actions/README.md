# Rust backend CI verbs

Same job names as `ci.yml` (`backend-unit-tests` · `integration-tests` ·
`sonar-backend` · `build-backend` · `deploy-backend` / `deploy-backend-stage`).
Implementations live here because GitHub does not interpolate `uses:`.

`backend/.github/actions/<verb>` dispatches here when `BACKEND_LANG=rust`.
`unit` runs `./cover.sh` (cargo llvm-cov, `coverage.lcov`, fail-under 80%).
`sonar` scans that report. Default clone CI stays Java Spring.
Set `BACKEND_FRAMEWORK` to `axum`. Docker `build` / `deploy` take `module_dir`
(context = this folder, service name = basename). Nested module paths are resolved
by `.github/actions/resolve-module-dir`.
