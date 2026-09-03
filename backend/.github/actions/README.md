# Backend CI verbs

`ci.yml` calls `./backend/.github/actions/<verb>` with
`module_dir: ${{ format('backend/{0}/backend-{0}-{1}', env.BACKEND_LANG, env.BACKEND_FRAMEWORK) }}`.

GitHub does not interpolate `uses:`. This adapter dispatches on `BACKEND_LANG`:

| LANG | `unit` / `integration` / `sonar` | `build` / `deploy` |
|------|----------------------------------|--------------------|
| `java` | `./backend/java/backend-java-spring/.github/actions/<verb>` | same module (Docker context = `module_dir`) |
| `python` | `./backend/python/.github/actions/<verb>` | same family (Docker context = `module_dir`) |
| `kotlin` | `./backend/kotlin/backend-kotlin-spring/.github/actions/<verb>` | same module (Docker context = `module_dir`) |
| `go` | `./backend/go/.github/actions/<verb>` | same family (Docker context = `module_dir`) |
| `javascript` | `./backend/javascript/.github/actions/<verb>` | same family (Docker context = `module_dir`) |
| `typescript` | `./backend/typescript/.github/actions/<verb>` | same family (Docker context = `module_dir`) |
| `csharp` | `./backend/csharp/.github/actions/<verb>` | same family (Docker context = `module_dir`) |
| other | STOP | STOP |

Unknown `BACKEND_LANG` never runs a foreign module action. Nested module paths
are resolved by `.github/actions/resolve-module-dir`.
