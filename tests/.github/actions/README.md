# Tests CI verbs

`ci.yml` calls `./tests/.github/actions/<verb>` with `module_dir` from stack knobs.

GitHub does not interpolate `uses:`. This adapter dispatches on `TESTS_LANG`:

| LANG | Action | `module_dir` |
|------|--------|----------------|
| `java` | `./tests/java/tests-java-gradle-junit5-allure3-selenide/.github/actions/<verb>` | 5-segment `tests/java/tests-java-{builder}-{framework}-{report}-{ui}` |
| `javascript` | `./tests/javascript/.github/actions/<verb>` | short `tests/javascript/tests-javascript-{ui}` (live: `playwright`) |
| `python` | `./tests/python/.github/actions/<verb>` | short `tests/python/tests-python-{ui}` (live: `selenium`) |
| other (`typescript`, …) | STOP | never a foreign / Java action |

A verb with no layer in the live JS module STOPs inside that family action (not `uses:` on Selenide).
Python verbs are live (`pytest -m` slices). `typescript` / unknown STOP at this adapter.
`resolve-module-dir` uses the nested path (basename only if that directory is missing).
