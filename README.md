# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

## Layout (3 product folders)

```
reference-app-copy/
  frontend/          # UI by language → stack (Dockerfile + .github/actions)
  backend/           # server by language → stack (…/.github/actions/build|unit)
  tests/             # automation (…/.github/actions/test-infra|prod-api)
  deploy/            # matrix, host nginx, smoke
  .github/workflows/ # deploy.yml / deploy_all.yml · test.yml / test_all.yml
```

### Naming convention

`{zone}-{language}-{stack}` — hyphens between segments.  
Underscore **only** in compound tool names, e.g. `tests-java-gradle-junit5-no_allure-selenide`.

Frontend layout: language → product module (stack in the name); component tests in `src/test/`.  
Full maps: [frontend/README.md](frontend/README.md) · [tests/NAMING.md](tests/NAMING.md) · **routing SSOT:** [deploy/matrix.yaml](deploy/matrix.yaml).

| Zone | Current modules | Future slots |
|------|-----------------|--------------|
| **frontend/javascript/** | `frontend-javascript-vanilla` (active), `react` / `angular` / `vue` / `jquery` (slots) | — |
| **frontend/typescript/** | `frontend-typescript-react` (+ RTL), `frontend-typescript-vue` (+ VTU), `angular` / `vanilla` / `jquery` (slots) | — |
| **frontend/_shared/** | `frontend-javascript-app`, `frontend-javascript-embed` | — |
| **frontend/_catalog/** | `frontend-javascript-preview` | — |
| **backend/java/** | `backend-java-spring` (active) | — |
| **backend/kotlin/** | `backend-kotlin-spring` (active) | — |
| **backend/python/** | `backend-python-flask`, `backend-python-fastapi`, `backend-python-django` (active) | — |
| **backend/go/** | — | `backend-go-gin`, `backend-go-stdlib` |
| **backend/node/** | — | `backend-node-express`, `backend-node-nest` |
| **tests/java/** | `tests-java-gradle-junit5-allure3-selenide` | junit4, testng, allure2, selenium, maven, … — [tests/NAMING.md](tests/NAMING.md) · matrix slots |
| **tests/javascript/** | `tests-javascript-playwright` | Cypress, … |
| **tests/typescript/** | — | `tests-typescript-playwright` (slot) |
| **tests/python/** | `tests-python-selenium` | playwright, … |
| **tests/kotlin/** | — | `tests-kotlin-gradle-junit5-allure3-selenide` (slot) |
| **tests/go/** | — | `tests-go-testing-allure3` (slot; selenoid-tests lang) |

### Routing (per-frontend containers × multi-backend)

```
https://reference-app-copy.autotests.ai/{backend}/{frontend}/
https://reference-app-copy.autotests.ai/{backend}/api/
```

- **first path segment** → which API answers `/{backend}/api/**`
- **second path segment** → which frontend container answers (host nginx → publish port)
- Frontends resolve `APP_BASE` / `API_BASE` from the URL — same `dist/` works under every backend prefix

Examples:

- […/backend-java-spring/frontend-typescript-react/](https://reference-app-copy.autotests.ai/backend-java-spring/frontend-typescript-react/)
- […/backend-java-spring/frontend-typescript-vue/](https://reference-app-copy.autotests.ai/backend-java-spring/frontend-typescript-vue/)
- `…/backend-python-flask/frontend-typescript-react/`
- `…/backend-python-fastapi/frontend-typescript-react/`
- `…/backend-python-django/frontend-javascript-vanilla/`
- `…/{backend}/{frontend}/stack/` — matrix switcher (shared UI overlay; header nav **Stack**)

Host `/` is empty (404). One public host — no backend subdomains.

Path constants: `backend/scripts/paths.sh`

### Layers (block 2)

Canon: [tests/LAYERS.md](tests/LAYERS.md) · CI: [`.github/workflows/test.yml`](.github/workflows/test.yml)

| Job | Where |
|-----|-------|
| `unit_backend` | `backend/java/backend-java-spring/` (action `unit`) |
| `unit_backend_python` | python backends — only via `test_all` / `include_python` |
| `test-infra` | `tests/java/…` (action `test-infra`) |
| `component_rtl` | `frontend/typescript/frontend-typescript-react/` (action `component`, off) |
| `component_vue` | `frontend/typescript/frontend-typescript-vue/src/test/` |
| `api` … `e2e` / `component_browser` / `visual` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

## Ports (local = prod host upstream)

SSOT: [`deploy/matrix.yaml`](deploy/matrix.yaml). Language base **+10**, stack within language **+1**.

| Port | Service | Notes |
|------|---------|-------|
| **8800** | `backend-java-spring` | |
| **8810** | `backend-kotlin-spring` | |
| **8820** | `backend-python-flask` | |
| **8821** | `backend-python-fastapi` | |
| **8822** | `backend-python-django` | |
| **8830** | `backend-go-gin` | slot |
| **8831** | `backend-go-stdlib` | slot |
| **8840** | `backend-node-express` | slot |
| **8841** | `backend-node-nest` | slot |
| **9800** | `frontend-javascript-vanilla` | compose publish |
| **9801** | `frontend-javascript-react` | slot |
| **9802** | `frontend-javascript-angular` | slot |
| **9803** | `frontend-javascript-vue` | slot |
| **9804** | `frontend-javascript-jquery` | slot |
| **9810** | `frontend-typescript-vanilla` | slot |
| **9811** | `frontend-typescript-react` | compose publish |
| **9812** | `frontend-typescript-angular` | slot |
| **9813** | `frontend-typescript-vue` | compose publish |
| **9814** | `frontend-typescript-jquery` | slot |

Next backend language → **8850+**. Next frontend language → **9820+**.  
Container-internal: backends `:8080`, frontends `:80`.  
Path routing (`/{backend}/api`, `/{backend}/{frontend}`) — **host nginx** ([`deploy/nginx/`](deploy/nginx/)); local compose exposes published ports only.

## Quick start

```bash
docker compose up -d --build
# published ports (same numbers as prod host upstreams)
curl -fsS http://localhost:8800/api/health
curl -fsS http://localhost:8810/api/health
curl -fsS http://localhost:8820/api/health
curl -fsS http://localhost:8821/api/health
curl -fsS http://localhost:8822/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:9811/
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:9800/
# prod path shape — host nginx only
# https://reference-app-copy.autotests.ai/backend-java-spring/api/health
```

| Service | Role |
|---------|------|
| `frontend-typescript-react` | React SPA (`:9811`) |
| `frontend-typescript-vue` | Vue SPA (`:9813`) |
| `frontend-javascript-vanilla` | vanilla static (`:9800`) |
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
| `BACKEND_JAVA_PORT` | `8800` |
| `BACKEND_KOTLIN_PORT` | `8810` |
| `BACKEND_FLASK_PORT` | `8820` |
| `BACKEND_FASTAPI_PORT` | `8821` |
| `BACKEND_DJANGO_PORT` | `8822` |
| `FRONTEND_TS_REACT_PORT` | `9811` |
| `FRONTEND_TS_VUE_PORT` | `9813` |
| `FRONTEND_JS_VANILLA_PORT` | `9800` |

**CD (does not run autotests):**

| Workflow | Role |
|----------|------|
| [`deploy.yml`](.github/workflows/deploy.yml) | Default CD on `push` main: `backend-java-spring` + `frontend-typescript-react` → SSH load → compose up selected services |
| [`deploy_all.yml`](.github/workflows/deploy_all.yml) | Manual: all active backends + frontends, then full [`deploy/server-deploy.sh`](deploy/server-deploy.sh) |

Stack build steps live next to modules, e.g. [`backend/java/backend-java-spring/.github/actions/build`](backend/java/backend-java-spring/.github/actions/build/action.yml).

**Tests (separate from deploy):**

| Workflow | Role |
|----------|------|
| [`test.yml`](.github/workflows/test.yml) | Default: java-spring `unit`, `test-infra`; `prod_api` after successful Deploy (`workflow_run`) |
| [`test_all.yml`](.github/workflows/test_all.yml) | Manual: same + python backend unit matrix |

Manual on host: `bash deploy/server-deploy.sh` (builds locally). CD `deploy_mode=all`: `SKIP_BUILD=1 bash deploy/server-deploy.sh`.

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
