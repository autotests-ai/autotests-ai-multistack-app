# web (nginx)

Public entrypoint for local compose and (behind host nginx) production.

| Path | Target |
|------|--------|
| `/api/**` | `backend:8080` |
| `/login`, `/register`, `/`, assets | static files from `UI_MODULE` (+ `UI_RUNTIME`) |

Soft-route / SPA fallback lives here — not in Spring.
