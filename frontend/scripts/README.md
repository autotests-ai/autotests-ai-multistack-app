# Frontend tooling (ethalon SSOT)

| Script | Role |
|--------|------|
| `sync-ds-runtime.sh` | Subset css/js/templates from design-system → `_shared/frontend-javascript-app` |
| `sync-react-ui.sh` | Vendored TSX wrappers into `_shared/frontend-react-ui` (no CSS) |
| `sync-stack-matrix.py` | deploy ports + hub `tests.modules` → `stack/matrix.json` + `js/env-hosts.js` (Stage/Prod follow the current host; `public_host` is loopback fallback) |
| `catalog-cd-matrix.py` | Catalog CD services: deploy frontends minus `teaching: true` |

Run from this tree’s root (`ethalon/` or the live clone):

```bash
bash frontend/scripts/sync-ds-runtime.sh
bash frontend/scripts/sync-react-ui.sh
python frontend/scripts/sync-stack-matrix.py
python frontend/scripts/catalog-cd-matrix.py --pretty
```

Product UI lives under `frontend/typescript/…` and the two vendor snapshots above.
Each frontend module Dockerfile packs itself + `UI_RUNTIME` at image build.
