# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [backend-java-spring.reference-app-copy.autotests.ai](https://backend-java-spring.reference-app-copy.autotests.ai)

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
| **frontend/typescript/** | `frontend-typescript-react` (+ RTL), `angular` / `vue` / `vanilla` (slots) | — |
| **frontend/_shared/** | `frontend-javascript-app`, `frontend-javascript-embed` | — |
| **frontend/_catalog/** | `frontend-javascript-preview` | — |
| **backend/java/** | `backend-java-spring` (active) | — |
| **backend/kotlin/** | — | `backend-kotlin-spring` |
| **backend/python/** | `backend-python-flask` (stub health) | `backend-python-fastapi`, `backend-python-django` |
| **tests/java/** | `tests-java-gradle-junit5-allure3-selenide` | junit4, testng, allure2, selenium, … — [tests/NAMING.md](tests/NAMING.md) |
| **tests/javascript/** | `tests-javascript-playwright` | Cypress, … |
| **tests/python/** | `tests-python-selenium` | playwright, … |

### Routing (shared UI × multi-backend)

```
https://{backend}.reference-app-copy.autotests.ai/{frontend}/
```

- **subdomain** → which API answers `/api/**` (one container per backend)
- **path** → which product UI (packed once into shared `web` image)
- Frontends call **relative** `/api/*` — same `dist/` works on every backend host

Examples:

- [backend-java-spring…/frontend-typescript-react/](https://backend-java-spring.reference-app-copy.autotests.ai/frontend-typescript-react/)
- `backend-python-flask.…/frontend-typescript-react/`
- `backend-python-flask.…/frontend-javascript-vanilla/`

Host `/` is empty (404). Module id = DNS label (Let's Encrypt rejects `_`).

Path constants: `backend/scripts/paths.sh`

### Layers (block 2)

Canon: [tests/LAYERS.md](tests/LAYERS.md) · CI: [`.github/workflows/test.yml`](.github/workflows/test.yml)

| Job | Where |
|-----|-------|
| `unit_backend` | `backend/java/backend-java-spring/src/test/` |
| `test-infra` | `…/tests/testinfra/` (`@Layer("test-infra")` + `@Tag("test-infra")`) |
| `component_rtl` | `frontend/typescript/frontend-typescript-react/src/test/` |
| `api` … `e2e` / `component_browser` / `visual` | `tests/java/tests-java-gradle-junit5-allure3-selenide/` |

## Quick start

```bash
docker compose up -d --build
# edge publishes SERVER_PORT (default 8080; if busy: SERVER_PORT=18080 docker compose up -d)
curl -fsS http://localhost:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/frontend-typescript-react/
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/frontend-javascript-vanilla/
# flask stub via Host (same UI mounts, different /api)
curl -fsS -H 'Host: backend-python-flask.localhost' http://localhost:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/   # 404
```

| Service | Role |
|---------|------|
| `edge` | local Host router (`SERVER_PORT`, default 8080) |
| `web` | shared static UIs only (no `/api`) |
| `backend-java-spring` | Spring JSON API |
| `backend-python-flask` | health stub for routing demos |
| `postgres` | one instance, DB per backend (`reference_app_java`, …) |

## Deploy

**Production URL:** https://backend-java-spring.reference-app-copy.autotests.ai/frontend-typescript-react/

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/reference_app_copy/reference-app-copy` |
| `WEB_PORT` | `8801` (shared static) |
| `BACKEND_JAVA_PORT` | `8810` |
| `BACKEND_FLASK_PORT` | `8811` |
| `SERVER_PORT` | `8800` (local-style edge; prod host nginx splits API/static) |

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
