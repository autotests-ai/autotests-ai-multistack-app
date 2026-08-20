# Backend CI verbs

`ci.yml` calls `./backend/.github/actions/<verb>` with
`module_dir: ${{ format('backend/{0}/backend-{0}-{1}', env.BACKEND_LANG, env.BACKEND_FRAMEWORK) }}`.

GitHub does not interpolate `uses:`. Adapter `uses:` must match that path
(today `./backend/java/backend-java-spring/.github/actions/<verb>`).

Python twins: `./backend/python/.github/actions/<verb>` — run by
`.github/workflows/backend_python_github.yml`, not this teaching adapter.
