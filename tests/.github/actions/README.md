# Tests CI verbs

`ci.yml` calls `./tests/.github/actions/<verb>` with `module_dir: ${{ env.TESTS_DIR }}`.

GitHub does not interpolate `uses:`. Adapter `uses:` must match `TESTS_DIR`.
