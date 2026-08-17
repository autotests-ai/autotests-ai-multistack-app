# Frontend tooling

| Script | Role |
|--------|------|
| `sync-ds-runtime.sh` | Subset css/js/templates from design-system → `_shared/frontend-javascript-app` (SSOT: ethalon) |
| `sync-react-ui.sh` | Vendored TSX wrappers into `_shared/frontend-react-ui` (no CSS; SSOT: ethalon) |
| `wire-ui.sh` | Symlink full design-system into `_shared/frontend-javascript-embed` (monorepo) |
| `sync-stack-matrix.py` | `deploy/matrix.yaml` → `stack/matrix.json` + `js/env-hosts.js` |

Run from this clone’s root:

```bash
bash frontend/scripts/sync-ds-runtime.sh
bash frontend/scripts/sync-react-ui.sh
python frontend/scripts/sync-stack-matrix.py
```

Product UI lives under `frontend/javascript/…`, `frontend/typescript/…`, and `_shared/frontend-javascript-app/`.
Each frontend module Dockerfile packs itself + `UI_RUNTIME` at image build; backend stays API-only.
