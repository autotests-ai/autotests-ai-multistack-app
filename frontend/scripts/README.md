# Frontend tooling

| Script | Role |
|--------|------|
| `wire-ui.sh` | Symlink full design-system into `_shared/frontend-javascript-embed` (monorepo) |
| `sync-react-ui.sh` | Sync vendored `@zero-design-system/react` into `_shared/frontend-react-ui` |
| `sync-stack-matrix.py` | Stack matrix helper |

Product UI lives under `frontend/javascript/…`, `frontend/typescript/…`, and `frontend/_shared/frontend-javascript-app/`.
Each frontend module Dockerfile packs itself + `UI_RUNTIME` at image build; backend stays API-only.
