# edge (local)

Path-based router for local compose (one host):

| Path | Upstream |
|------|----------|
| `/backend-java-spring/api/` | `backend-java-spring` |
| `/backend-python-flask/api/` | `backend-python-flask` |
| `/backend-kotlin-spring/api/` | `backend-kotlin-spring` |
| `/backend-*/frontend-*` | shared `web` (backend prefix stripped) |

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:8080/backend-java-spring/api/health
curl -fsS http://127.0.0.1:8080/backend-python-flask/api/health
curl -fsS http://127.0.0.1:8080/backend-kotlin-spring/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/backend-java-spring/frontend-typescript-react/
```

Prod uses host nginx from [`../nginx/`](../nginx/) (same path split); edge is for local parity.
