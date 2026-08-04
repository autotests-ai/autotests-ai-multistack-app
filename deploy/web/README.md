# web (nginx)

Public entrypoint for local compose and (behind host nginx) production.

| Path | Target |
|------|--------|
| `/api/**` | `backend:8080` |
| `/frontend_typescript_react/**` | static UI (`UI_MODULE` + `UI_RUNTIME`) under `UI_MOUNT` |
| `/`, other | **404** (empty host root) |

Soft-route / SPA fallback lives here — not in Spring.

Compose build-args: `UI_MODULE`, `UI_RUNTIME`, `UI_MOUNT` (default `frontend_typescript_react`).
