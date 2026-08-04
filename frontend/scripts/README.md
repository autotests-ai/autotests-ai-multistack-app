# Frontend tooling

| Script | Role |
|--------|------|
| `wire-ui.sh` | Symlink full design-system into `_shared/frontend-javascript-embed` (monorepo) |
| `sync-component-preview.sh` | Materialize DS preview pages into `_catalog/` for component tests |

Product UI lives under `frontend/javascript/…` and `frontend/_shared/frontend-javascript-app/`.
`deploy/web` (nginx) packs `UI_MODULE` / `UI_RUNTIME` at image build; backend stays API-only.
