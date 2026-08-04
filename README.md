# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

## Layout (3 product folders)

```
reference-app-copy/
  frontend/          # UI by language → stack (one source per module)
  backend/           # server by language → stack (+ scripts/)
  tests/             # automation by language → runner
  deploy/            # matrix, edge, shared web, host nginx, smoke
  .github/workflows/ # deploy.yml + test.yml
```

### Naming convention

`{zone}-{language}-{stack}` — hyphens between segments.  
Underscore **only** in compound tool names, e.g. `tests-java-gradle-junit5-no_allure-selenide`.

Frontend layout: language → product module (stack in the name); component tests in `src/test/`.  
Full maps: [frontend/README.md](frontend/README.md) · [tests/NAMING.md](tests/NAMING.md) · **routing SSOT:** [deploy/matrix.yaml](deploy/matrix.yaml).

| Zone | Current modules | Future slots |
|------|-----------------|--------------|
| **frontend/javascript/** | `frontend-javascript-vanilla` (active), `react` / `angular` / `vue` (slots) | — |
| **frontend/typescript/** | `frontend-typescript-react` (+ RTL), `frontend-typescript-vue` (+ VTU), `angular` / `vanilla` (slots) | — |
| **frontend/_shared/** | `frontend-javascript-app`, `frontend-javascript-embed` | — |
| **frontend/_catalog/** | `frontend-javascript-preview` | — |
| **backend/java/** | `backend-java-spring` (active) | — |
| **backend/kotlin/** | `backend-kotlin-spring` (active) | — |
| **backend/python/** | `backend-python-flask`, `backend-python-fastapi`, `backend-python-django` (active) | — |
| **backend/go/** | — | `backend-go-gin`, `backend-go-stdlib` |
| **tests/java/** | `tests-java-gradle-junit5-allure3-selenide` | junit4, testng, allure2, selenium, … — [tests/NAMING.md](tests/NAMING.md) |
| **tests/javascript/** | `tests-javascript-playwright` | Cypress, … |
| **tests/python/** | `tests-python-selenium` | playwright, … |

### Routing (shared UI × multi-backend)

```
https://reference-app-copy.autotests.ai/{backend}/{frontend}/
https://reference-app-copy.autotests.ai/{backend}/api/
```

- **first path segment** → which API answers `/{backend}/api/**`
- **second path segment** → which product UI (packed once into shared `web` image)
- Frontends resolve `APP_BASE` / `API_BASE` from the URL — same `dist/` works under every backend prefix

Examples:

- […/backend-java-spring/frontend-typescript-react/](https://reference-app-copy.autotests.ai/backend-java-spring/frontend-typescript-react/)
- […/backend-java-spring/frontend-typescript-vue/](https://reference-app-copy.autotests.ai/backend-java-spring/frontend-typescript-vue/)
- `…/backend-python-flask/frontend-typescript-react/`
- `…/backend-python-fastapi/frontend-typescript-react/`
- `…/backend-python-django/frontend-javascript-vanilla/`

Host `/` is empty (404). One public host — no backend subdomains.

Path constants: `backend/scripts/paths.sh`

### Layers (block 2)

Canon: [tests/LAYERS.md](tests/LAYERS.md) · CI: [`.github/workflows/test.yml`](.github/workflows/test.yml)

| Job | Where |
|-----|-------|
| `unit_backend` | `backend/java/backend-java-spring/src/test/` |
| `unit_backend_python` | `backend/python/backend-python-{flask,fastapi,django}/tests/` |
| `test-infra` | `…/tests/testinfra/` (`@Layer("test-infra")` + `@Tag("test-infra")`) |
| `component_rtl` | `frontend/typescript/frontend-typescript-react/src/test/` |
| `component_vue` | `frontend/typescript/frontend-typescript-vue/src/test/` |
| `api` … `e2e` / `component_browser` / `visual` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

## Ports (local = prod host upstream)

SSOT: [`deploy/matrix.yaml`](deploy/matrix.yaml). Language base **+10**, stack within language **+1**.

| Port | Service | Notes |
|------|---------|-------|
| **8700** | `edge` | local path router only (`SERVER_PORT`); prod uses host nginx `:443` |
| **8701** | `web` | shared static pack (`WEB_PORT`) |
| **8800** | `backend-java-spring` | |
| **8810** | `backend-kotlin-spring` | |
| **8820** | `backend-python-flask` | |
| **8821** | `backend-python-fastapi` | |
| **8822** | `backend-python-django` | |
| **8830** | `backend-go-gin` | slot |
| **8831** | `backend-go-stdlib` | slot |
| **9800** | `frontend-javascript-vanilla` | local serve / vite |
| **9801** | `frontend-javascript-react` | slot |
| **9802** | `frontend-javascript-angular` | slot |
| **9803** | `frontend-javascript-vue` | slot |
| **9810** | `frontend-typescript-vanilla` | slot |
| **9811** | `frontend-typescript-react` | |
| **9812** | `frontend-typescript-angular` | slot |
| **9813** | `frontend-typescript-vue` | |

Next backend language → **8840+**. Next frontend language → **9820+**.  
Container-internal: backends `:8080`, `web`/`edge` `:80`.

## Quick start

```bash
docker compose up -d --build
# edge publishes SERVER_PORT (default 8700)
curl -fsS http://localhost:8700/backend-java-spring/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8700/backend-java-spring/frontend-typescript-react/
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8700/backend-java-spring/frontend-javascript-vanilla/
# python backends — same UI mounts, different /{backend}/api
curl -fsS http://localhost:8700/backend-python-flask/api/health
curl -fsS http://localhost:8700/backend-python-fastapi/api/health
curl -fsS http://localhost:8700/backend-python-django/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8700/   # 404
# direct backend (same ports on prod host)
curl -fsS http://localhost:8800/api/health
```

| Service | Role |
|---------|------|
| `edge` | local path router (`SERVER_PORT`, default 8700) |
| `web` | shared static UIs only (no `/api`) |
| `backend-java-spring` | Spring JSON API (`:8800`) |
| `backend-kotlin-spring` | Spring Kotlin JSON API (`:8810`) |
| `backend-python-flask` | Flask JSON API (`:8820`) |
| `backend-python-fastapi` | FastAPI JSON API (`:8821`) |
| `backend-python-django` | Django JSON API (`:8822`) |
| `postgres` | one instance, DB per backend (`reference_app_java_spring`, `reference_app_python_flask`, …) |

## Deploy

**Production URL:** https://reference-app-copy.autotests.ai/backend-java-spring/frontend-typescript-react/

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/reference_app_copy/reference-app-copy` |
| `SERVER_PORT` | `8700` (local edge; prod host nginx splits API/static) |
| `WEB_PORT` | `8701` (shared static) |
| `BACKEND_JAVA_PORT` | `8800` |
| `BACKEND_KOTLIN_PORT` | `8810` |
| `BACKEND_FLASK_PORT` | `8820` |
| `BACKEND_FASTAPI_PORT` | `8821` |
| `BACKEND_DJANGO_PORT` | `8822` |

**CD:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — `build` (images on GHA) → `deploy` (SSH `docker load` + `SKIP_BUILD=1` [`deploy/server-deploy.sh`](deploy/server-deploy.sh)).

**Tests:** [`.github/workflows/test.yml`](.github/workflows/test.yml) — unit on PR/push; `prod_api` after successful Deploy (`workflow_run`).

Manual on host: `bash deploy/server-deploy.sh` (builds locally). CD path: `SKIP_BUILD=1 bash deploy/server-deploy.sh`.

### GitHub secrets & variables

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | **project-only** ed25519 for `reference_app_copy@212.92.101.15` (local: `~/.ssh/reference_app_copy_deploy`; not shared with `selenoid` / sibling apps) |
| `DEPLOY_HOST` | variable | `212.92.101.15` |
| `DEPLOY_USER` | variable | `reference_app_copy` |

Sibling prod (do not touch): [reference-app.autotests.ai](https://reference-app.autotests.ai) · port `8083`.

### Deferred (block 2+)

- Workflows: [`.github/workflows/_deferred/`](.github/workflows/_deferred/)
- Legacy: [`tests/_deferred/`](tests/_deferred/)

## Related

- Upstream: [autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)
