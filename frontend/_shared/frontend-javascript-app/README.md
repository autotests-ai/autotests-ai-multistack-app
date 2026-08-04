# frontend-javascript-app

Lean design-system runtime used by the vanilla product UI (header + form CSS).

Overlay copied into each frontend nginx image at build
(see module `Dockerfile` under `frontend/**` and root `docker-compose.yml`).

## `/stack/` — backend × frontend switcher

Static page at `stack/` (served as `/{backend}/{frontend}/stack/` after host nginx strip).

- UI: `stack/index.html` + `stack/stack.js`
- Data: `stack/matrix.json` — sync from SSOT:

```bash
python frontend/scripts/sync-stack-matrix.py
```

Active modules link to `/{backend}/{frontend}/`; current path modules are highlighted. Slots are listed but not clickable.
