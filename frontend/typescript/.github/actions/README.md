# TypeScript frontend CI verbs

Same job names as `ci.yml` (`frontend-unit-tests` · `sonar-frontend` ·
`build-frontend` · `deploy-frontend`). Implementations live here because
GitHub does not interpolate `uses:`.

`frontend/.github/actions/<verb>` dispatches here when `FRONTEND_LANG=typescript`.
Set `FRONTEND_FRAMEWORK` to `react` / `vue` / `angular` / `jquery` / `vanilla`.
