# Frontend CI verbs

`ci.yml` calls `./frontend/.github/actions/<verb>` with
`module_dir: ${{ format('frontend/{0}/frontend-{0}-{1}', env.FRONTEND_LANG, env.FRONTEND_FRAMEWORK) }}`.

GitHub does not interpolate `uses:`. Adapter `uses:` must match that path
(today `./frontend/typescript/frontend-typescript-react/.github/actions/<verb>`).
