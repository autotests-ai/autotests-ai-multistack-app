# frontend-javascript-app

Lean design-system runtime used by the vanilla product UI (header + form CSS).

Overlay copied into each frontend nginx image at build
(see module `Dockerfile` under `frontend/**` and root `docker-compose.yml`).

## `/stack/` — backend × frontend switcher

Product page (header + DS panels), not a standalone status board.

| Piece | Role |
|-------|------|
| `stack/matrix.json` | Public matrix artifact — sync from SSOT `deploy/matrix.yaml` |
| `js/stack-matrix.js` | Shared parse/href/fetch + vanilla DOM mount |
| `css/stack-page.css` + `css/badge.css` | Boards layout on DS tokens |
| `stack/index.html` | Vanilla thin shell (product header + `#stack-root`) |

```bash
python frontend/scripts/sync-stack-matrix.py
```

**SPA (React / Vue):** same `matrix.json` + `StackPage` route; Docker images drop `stack/index.html` so `/stack/` is owned by the SPA (nginx serves `index.html` for the route).

Active modules link to `/{backend}/{frontend}/stack/`; current path modules are highlighted. Current-pair badge opens app home. Slots are listed but not clickable.
