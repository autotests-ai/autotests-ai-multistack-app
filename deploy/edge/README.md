# edge (local)

Host-based router for local compose:

| Host | `/api` | `/frontend-*` |
|------|--------|----------------|
| `backend-java-spring.localhost` (default) | `backend-java-spring` | shared `web` |
| `backend-python-flask.localhost` | `backend-python-flask` | shared `web` |

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS -H 'Host: backend-python-flask.localhost' http://127.0.0.1:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/frontend-typescript-react/
```

Prod uses host nginx vhosts from [`../nginx/`](../nginx/) (same split); edge is for local parity.
