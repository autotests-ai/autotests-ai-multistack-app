# Frontend CI verbs

`ci.yml` calls `./frontend/.github/actions/<verb>` with
`module_dir: ${{ format('frontend/{0}/frontend-{0}-{1}', env.FRONTEND_LANG, env.FRONTEND_FRAMEWORK) }}`.

GitHub does not interpolate `uses:`. This adapter dispatches on `FRONTEND_LANG`:

| LANG | Action |
|------|--------|
| `typescript` | `./frontend/typescript/.github/actions/<verb>` |
| `javascript` | `./frontend/javascript/.github/actions/<verb>` |

`FRONTEND_FRAMEWORK` selects the module directory (react / vue / …), not a second workflow.
