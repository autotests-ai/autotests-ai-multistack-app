# Tests CI verbs

`ci.yml` calls `./tests/.github/actions/<verb>` with `module_dir` from stack knobs.

GitHub does not interpolate `uses:`. This adapter dispatches on `TESTS_LANG`:

| LANG | Action | `module_dir` |
|------|--------|----------------|
| `java` | `./tests/java/tests-java-junit5-rest_assured-selenide/.github/actions/<verb>` | living: `junit5-rest_assured-{selenide,selenium}`, `junit5-api_request-playwright`, `junit5-rest_assured`, `junit5-retrofit2`; runner: `{framework}-{ui}`, `gatling` |
| `kotlin` | same JVM infra/sonar adapter | living: `junit5-ktor-{selenide,selenium}`, `junit5-api_request-playwright`, `junit5-ktor` |
| `javascript` | `./tests/javascript/.github/actions/<verb>` | short `tests/javascript/tests-javascript-{ui}`; `playwright` → UI-only living, `api_request-playwright` → combo |
| `python` | `./tests/python/.github/actions/<verb>` | short `tests/python/tests-python-{ui}`; `selenium` → `requests-selenium`, `selene` → `requests-selene`, `playwright` → `api_request-playwright` |
| `typescript` | `./tests/typescript/.github/actions/<verb>` | short `tests/typescript/tests-typescript-{ui}`; `playwright` → living `api_request-playwright` or `axios` |
| `csharp` | `./tests/csharp/.github/actions/<verb>` (`infra` / `sonar`) | living: `nunit-restsharp-selenium`, `xunit-api_request-playwright`, `nunit-restsharp` |
| `go` | `./tests/go/.github/actions/<verb>` (`infra` / `sonar`) | living: `testing-api_request-playwright`, `testing-net_http` |
| `rust` | `./tests/rust/.github/actions/<verb>` (`infra` / `sonar`) | living: `testing-reqwest`, `testing-selenium`, `testing-reqwest-selenium` |
| other | STOP | never a foreign / Java action |

A verb with no layer in the live JS module STOPs inside that family action (not `uses:` on Selenide).
Python verbs are live (`pytest -m` slices). `TESTS_LANG=typescript` dispatches to `./tests/typescript/.github/actions/<verb>`.
`resolve-module-dir` uses the nested path (basename only if that directory is missing).
