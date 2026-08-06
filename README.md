# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, orchestrated CI/CD (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

## Layout (3 product folders)

```
reference-app-copy/
  frontend/          # UI by language → stack
  backend/           # server by language → stack
  tests/             # automation — see tests/LAYERS.md
  deploy/            # matrix, host nginx
  .github/workflows/ # ci.yml — single workflow
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
| **frontend/_shared/** | `frontend-javascript-app`, `frontend-javascript-embed`, `frontend-react-ui` | — |
| **backend/java/** | `backend-java-spring` (active) | — |
| **backend/kotlin/** | `backend-kotlin-spring` (active) | — |
| **backend/python/** | `backend-python-flask`, `backend-python-fastapi`, `backend-python-django` (active) | — |
| **backend/go/** | `backend-go-gin`, `backend-go-stdlib` (active) | — |
| **backend/javascript/** | `backend-javascript-express`, `backend-javascript-nest` (active) | — |
| **backend/typescript/** | `backend-typescript-express`, `backend-typescript-nest` (active) | — |
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

### Layers

Canon: [tests/LAYERS.md](tests/LAYERS.md) · all jobs live in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Job | Where |
|-----|-------|
| `unit-tests` | `BACKEND_DIR` — command by `BACKEND_LANG` (gradle/JaCoCo, pytest, `go test`, or `npm test`) |
| `tests-harness-backend` | `TESTS_DIR` — java: `-DincludeTags=harness-backend` + JaCoCo (`ConfigReader`); parallel pre-flight, gates e2e via `sonar-tests` |
| `tests-harness-frontend` | `TESTS_DIR` — java: `-DincludeTags=harness-frontend` + JaCoCo (CSS/HAR helpers); PR without deploy; on `main` after `deploy-frontend`, before `e2e-smoke` |
| `component-tests` | `FRONTEND_DIR` — `npm test` |
| `integration-tests` | `TESTS_DIR` — after `deploy-backend` (java: `-DincludeTags=integration`; else full suite); also dispatch `layers=integration\|all` |
| `e2e-smoke` | after `deploy-frontend` on push — java: `-DincludeTags=smoke` (thin UI e2e) |
| `e2e-tests` | dispatch `layers=e2e\|all` — java: `-DincludeTags=e2e` (default excludes visual); `all` → `e2e,visual`; override via `include_tags` / `exclude_tags` |
| `e2e-update-baselines` | dispatch `update_baselines=true` — java: `-DincludeTags=visual -DupdateBaselines=true` |
| `manual-tests` | dispatch `layers=manual\|all` — java: `-DincludeTags=manual` (exploratory stubs **in code**, `tests/manual/`) |

`unit-tests`, `component-tests`, and both harness jobs block a pull request. Browser layers
and extra language runners have no scheduled job — dispatch with `layers`
(`integration` \| `e2e` \| `manual` \| `all`) / `runners` (`javascript` \| `python` \| `both`)
when you want them. Stack defaults (`BACKEND` / `BACKEND_LANG` / `FRONTEND` / `TESTS` /
`TESTS_LANG`) live once at the top of [`ci.yml`](.github/workflows/ci.yml).

## Ports (local = prod host upstream)

SSOT: [`deploy/matrix.yaml`](deploy/matrix.yaml). Language base **+10**, stack within language **+1**.

| Port | Service | Notes |
|------|---------|-------|
| **8800** | `backend-java-spring` | |
| **8810** | `backend-kotlin-spring` | |
| **8820** | `backend-python-flask` | |
| **8821** | `backend-python-fastapi` | |
| **8822** | `backend-python-django` | |
| **8830** | `backend-go-gin` | |
| **8831** | `backend-go-stdlib` | |
| **8840** | `backend-javascript-express` | |
| **8841** | `backend-javascript-nest` | |
| **8850** | `backend-typescript-express` | |
| **8851** | `backend-typescript-nest` | |
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

Next backend language → **8860+**. Next frontend language → **9820+**.  
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

One workflow — [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Event | Jobs |
|-------|------|
| pull request | `unit-tests` · `component-tests` · `tests-harness-backend` · `tests-harness-frontend` |
| push to `main` | same four → backend lane `sonar-backend` → `build-backend` → `deploy-backend` → `integration-tests`; frontend lane `sonar-frontend` → `build-frontend` → `deploy-frontend` → `tests-harness-frontend` → `e2e-smoke`; both harness → `sonar-tests` → join at `e2e-tests` |

`build` runs `docker compose build` + `docker compose push`, so `docker-compose.yml` stays the only place describing how an image is built. Images go to GHCR as `ghcr.io/autotests-ai/reference-app-copy-<service>:<sha>`; the tag comes from `IMAGE_TAG` (defaults to `latest` locally).

`deploy` connects over SSH and runs six lines: checkout the deployed commit, log in to GHCR, `docker compose pull`, `docker compose up -d`, then `curl --retry` on `/api/health`. There is no deploy script on the host. The script opens with `set -euo pipefail` — otherwise a failed `pull` would leave the previous containers running and the health check would still answer `200`.

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/reference_app_copy/reference-app-copy` |
| Deployed stacks | `env.BACKEND` + `env.FRONTEND` in `ci.yml` (defaults: java-spring + typescript-react) |

Allure report, TestOps and notifications will be added later as ordinary jobs after `prod-api`.

### GitHub secrets & variables

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | **project-only** ed25519 for `reference_app_copy@212.92.101.15` (local: `~/.ssh/reference_app_copy_deploy`; not shared with `selenoid` / sibling apps) |
| `DEPLOY_HOST` | variable | `212.92.101.15` — required, no fallback in the workflow |
| `DEPLOY_USER` | variable | `reference_app_copy` |

GHCR needs no extra secret: `build` and `deploy` both authenticate with the run's `GITHUB_TOKEN` — `build` under `packages: write`, `deploy` under `packages: read`, because a freshly published package is private.

Sibling prod (do not touch): [reference-app.autotests.ai](https://reference-app.autotests.ai) · port `8083`.

### Deferred (block 2+)

- Legacy: [`tests/_deferred/`](tests/_deferred/)

## Related

- Upstream: [autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)
