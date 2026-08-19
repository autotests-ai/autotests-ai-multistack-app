# Frontend CI verbs

`ci.yml` calls `./frontend/.github/actions/<verb>` with `module_dir: ${{ env.FRONTEND_DIR }}`.

GitHub does not interpolate `uses:`. Adapter `uses:` must match `FRONTEND_DIR`.
