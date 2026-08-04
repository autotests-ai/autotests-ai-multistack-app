# web (nginx)

Public entrypoint for local compose and (behind host nginx) production.

| Path | Target |
|------|--------|
| `/api/**` | `backend:8080` |
| `/frontend-typescript-react/**` | Vite SPA (`dist/`) + lean DS runtime under `UI_MOUNT` |
| `/`, other | **404** (empty host root) |

Multi-stage [`Dockerfile`](Dockerfile): Node builds `UI_MODULE` → `dist/`, then nginx packs `dist/` + `UI_RUNTIME` into `UI_MOUNT`. Soft-route / SPA fallback lives here — not in Spring.

Compose build-args:

| Arg | Default |
|-----|---------|
| `UI_MODULE` | `frontend/typescript/react/frontend-typescript-react` |
| `UI_RUNTIME` | `frontend/_shared/frontend-javascript-app` |
| `UI_MOUNT` | `frontend-typescript-react` |
| `REACT_UI` | `frontend/_shared/frontend-react-ui` (build stage alias) |
