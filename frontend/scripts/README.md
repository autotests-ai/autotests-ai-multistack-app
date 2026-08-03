# Frontend tooling

| Script | Role |
|--------|------|
| `wire-ui.sh` | Symlink full design-system into `_shared/frontend_javascript_embed` (monorepo) |
| `sync-component-preview.sh` | Materialize DS preview pages into `_catalog/` for component tests |

Product UI lives under `frontend/javascript/…` and `frontend/_shared/frontend_javascript_app/`.
Docker packs those into the Spring jar at image build (see `backend/java/backend_java_spring/Dockerfile`).
