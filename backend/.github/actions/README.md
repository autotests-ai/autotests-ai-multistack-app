# Backend CI verbs

`ci.yml` calls `./backend/.github/actions/<verb>` with `module_dir: ${{ env.BACKEND_DIR }}`.

GitHub does not interpolate `uses:`. The `uses:` path in each adapter must match the
active module (same value as `BACKEND_DIR`).
