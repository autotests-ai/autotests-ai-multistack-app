# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — same Spring Boot + static/React UI stack, **deploy-only** CI for block 1.

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo workspace: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

| Path | Role |
|------|------|
| `backend/` | Spring Boot — `GET /api/health`, `GET /api/items`, JWT auth API, static UI, Flyway + Postgres |
| `frontend/` | design-system embed symlinks (`scripts/wire-ui.sh`) |
| `frontend-react/` | React SPA (Vite + React Router) |
| `tests/` | Browser + API tests (block 2 — not wired in CI yet) |
| `deploy/` | nginx vhost, server deploy, health poll, smoke |
| `.github/workflows/deploy.yml` | **Only** runnable workflow — autodeploy on push `main` |

Sibling prod (do not touch): [reference-app.autotests.ai](https://reference-app.autotests.ai) on the same host, port `8083`.

## Quick start (local)

```bash
./scripts/sync-app-static.sh
docker compose up -d --build
curl -fsS http://localhost:8080/api/health
```

## Deploy

**Production URL:** https://reference-app-copy.autotests.ai

**Host:** `212.92.101.15` (box3-zoo, same metal as reference-app) · user `selenoid`

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/selenoid/reference-app-copy` |
| `SERVER_PORT` | `8084` |
| `PUBLIC_URL` | `https://reference-app-copy.autotests.ai` |

**Manual bootstrap (first time on server):**

```bash
export APP_DIR=/home/selenoid/reference-app-copy
export SERVER_PORT=8084
git clone https://github.com/autotests-ai/reference-app-copy.git "$APP_DIR"
cd "$APP_DIR"
docker compose up -d --build
bash deploy/health-poll.sh
sudo NGINX_CONF_SRC=./deploy/nginx/reference-app-copy.autotests.ai.conf \
  NGINX_SITE_NAME=reference-app-copy \
  bash deploy/nginx/sync-nginx.sh
bash deploy/smoke-remote.sh https://reference-app-copy.autotests.ai
```

**Autodeploy (GitHub Actions):** push to `main` or `workflow_dispatch` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### GitHub secrets & variables

Configure in repo **Settings → Secrets and variables → Actions**:

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | deploy SSH private key (Ed25519) for `selenoid@212.92.101.15` |
| `DEPLOY_HOST` | variable (optional) | `212.92.101.15` |
| `DEPLOY_USER` | variable (optional) | `selenoid` |

**DNS:** `reference-app-copy.autotests.ai` → `212.92.101.15` (A record, GoDaddy `autotests.ai` zone).

**TLS:** reuses wildcard cert `autotests.ai` on box3 (same pattern as reference-app nginx vhost).

**Ports on prod host:** copy backend `8084` · reference-app `8083` · autotests.ai `8081` · Jenkins `8082` · Selenoid UI `8080`.

### Deferred CI (block 2+)

Pyramid / build / sonar / visual workflows from the upstream fork live in [`.github/workflows/_deferred/`](.github/workflows/_deferred/) — **not executed** by GHA. Block 2 will add **one** test workflow with pyramid layers added incrementally.

## Related

- Upstream SSOT: [autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)
- CI roles canon: `docs/rag/config/ci-workflow-ethalon.md` (monorepo)
- Design system: `projects/design-system-home/design-system/`
