# Frontend tooling (ethalon SSOT)

| Script | Role |
|--------|------|
| `sync-ds-runtime.sh` | Subset css/js/templates from design-system → `_shared/frontend-javascript-app`, then fan-out → every `frontend/*/frontend-*/vendor/ds` |
| `sync-react-ui.sh` | Vendored TSX wrappers into `_shared/frontend-react-ui` (no CSS), then fan-out → both `*react` `vendor/react-ui` |
| `sync-stack-matrix.py` | deploy ports + hub `tests.modules` → `js/env-hosts.js` + landing `autotests-ai-app/.../public/stack/matrix.json`; fan-out env-hosts into every `vendor/ds` |
| `catalog-cd-matrix.py` | Catalog CD JSON: deploy frontends minus `teaching: true`; writes `deploy/catalog-matrix.json` for CI |

Run from this tree’s root (`ethalon/` or the live clone):

```bash
bash frontend/scripts/sync-ds-runtime.sh
bash frontend/scripts/sync-react-ui.sh
python frontend/scripts/sync-stack-matrix.py
python frontend/scripts/catalog-cd-matrix.py --write
python frontend/scripts/catalog-cd-matrix.py --check
```

Product UI lives under `frontend/typescript/…` and `frontend/javascript/…`.
Each frontend builds from its own folder (`vendor/ds`; `*react` also `vendor/react-ui`).
