# Tests CI verbs

`ci.yml` calls `./tests/.github/actions/<verb>` with `module_dir` from stack knobs.

GitHub does not interpolate `uses:`. This adapter dispatches on `TESTS_LANG`:

| LANG | Action | `module_dir` |
|------|--------|----------------|
| `java` | `./tests/java/tests-java-gradle-junit5-allure3-selenide/.github/actions/<verb>` | 5-segment `tests/java/tests-java-{builder}-{framework}-{report}-{ui}` |
| `kotlin` | same JVM infra/sonar adapter; other verbs STOP (HTTP-only Ktor has no UI) | 5-segment `tests/kotlin/tests-kotlin-{builder}-{framework}-{report}-{ui}` (live: `ktor`) |
| `javascript` | `./tests/javascript/.github/actions/<verb>` | short `tests/javascript/tests-javascript-{ui}` (live: `playwright`) |
| `python` | `./tests/python/.github/actions/<verb>` | short `tests/python/tests-python-{ui}` (live: `selenium` or `httpx`) |
| `typescript` | `./tests/typescript/.github/actions/<verb>` | short `tests/typescript/tests-typescript-{ui}` (live: `playwright` or `axios`) |
| `csharp` | `./tests/csharp/.github/actions/<verb>` (`infra` / `sonar`) | 4-segment `tests/csharp/tests-csharp-{framework}-{report}-{ui}` (live: `nunit` · `allure3` · `restsharp` or `selenium`) |
| `go` | `./tests/go/.github/actions/<verb>` (`infra` / `sonar`) | 4-segment `tests/go/tests-go-{framework}-{report}-{ui}` (live: `testing` · `allure3` · `net_http`) |
| other | STOP | never a foreign / Java action |

A verb with no layer in the live JS module STOPs inside that family action (not `uses:` on Selenide).
Python verbs are live (`pytest -m` slices). `TESTS_LANG=typescript` dispatches to `./tests/typescript/.github/actions/<verb>`.
`resolve-module-dir` uses the nested path (basename only if that directory is missing).
