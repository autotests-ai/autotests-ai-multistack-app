# Backend CI verbs

`ci.yml` calls `./backend/.github/actions/<verb>` with
`module_dir: ${{ format('backend/{0}/backend-{0}-{1}', env.BACKEND_LANG, env.BACKEND_FRAMEWORK) }}`.

GitHub does not interpolate `uses:`. This adapter dispatches on `BACKEND_LANG`:

| LANG | Action |
|------|--------|
| `java` | `./backend/java/backend-java-spring/.github/actions/<verb>` |
| `python` | `./backend/python/.github/actions/<verb>` |

`build` / `deploy` stay on the Docker verbs under the java-spring module action (they take `module_dir` / compose service name from the basename).
