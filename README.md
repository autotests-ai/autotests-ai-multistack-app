# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [backend-java-spring.reference-app-copy.autotests.ai](https://backend-java-spring.reference-app-copy.autotests.ai)

## Layout (3 product folders)

```
reference-app-copy/
  frontend/          # UI by language → stack
  backend/           # server by language → stack (+ scripts/)
  tests/             # automation by language → runner
  deploy/            # prod nginx, smoke, health
  .github/workflows/ # deploy.yml only (runnable)
```

### Naming convention

`{zone}_{language}_{stack}` — underscores between segments.  
Hyphen **only** in compound tool names, e.g. `tests_typescript_react-testing-library`, `tests_java_gradle_junit5_no-allure_selenide`.

Frontend layout: language → UI stack (`react` / `vanilla`) → product + co-located component tests.  
Full maps: [frontend/README.md](frontend/README.md) · [tests/NAMING.md](tests/NAMING.md).

| Zone | Current modules | Future slots |
|------|-----------------|--------------|
| **frontend/javascript/react/** | `frontend_javascript_react`, `tests_javascript_react-testing-library` (slots) | — |
| **frontend/javascript/vanilla/** | `frontend_javascript_vanilla` (active) | vanilla component tests |
| **frontend/typescript/react/** | `frontend_typescript_react`, `tests_typescript_react-testing-library` | — |
| **frontend/typescript/vanilla/** | `frontend_typescript_vanilla` (slot) | vanilla component tests |
| **frontend/_shared/** | `frontend_javascript_app`, `frontend_javascript_embed` | — |
| **frontend/_catalog/** | `frontend_javascript_preview` | — |
| **backend/java/** | `backend_java_spring` | `backend_kotlin_spring`, … |
| **backend/python/** | — | `backend_python_fastapi`, `backend_python_flask` |
| **tests/java/** | `tests_java_gradle_junit5_allure3_selenide` | junit4, testng, allure2, selenium, … — [tests/NAMING.md](tests/NAMING.md) |
| **tests/javascript/** | `tests_javascript_playwright` | Cypress, … |
| **tests/python/** | `tests_python_selenium` | playwright, … |

**Prod routing:** `https://{backend}.reference-app-copy.autotests.ai/{frontend}/`  
Current: [backend-java-spring…/frontend_typescript_react/](https://backend-java-spring.reference-app-copy.autotests.ai/frontend_typescript_react/) (hyphens in DNS; host `/` empty).

Path SSOT: `backend/scripts/paths.sh`

### Layers (block 2)

Canon: [tests/LAYERS.md](tests/LAYERS.md) · CI: [`.github/workflows/test.yml`](.github/workflows/test.yml)

| Job | Where |
|-----|-------|
| `unit_backend` | `backend/java/backend_java_spring/src/test/` |
| `unit_test-infra` | `…/tests/unit/testinfra/` (`@Layer("unit")` + `@Tag("test-infra")`) |
| `component_rtl` | `frontend/typescript/react/tests_typescript_react-testing-library/` |
| `api` … `e2e` / `component_browser` / `visual` | `tests/java/tests_java_gradle_junit5_allure3_selenide/` |

## Quick start

```bash
docker compose up -d --build
curl -fsS http://localhost:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/frontend_typescript_react/
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/   # 404 — empty root
```

- `backend` — Spring JSON API only (`/api/**`)
- `web` — nginx serves UI at `/frontend_typescript_react/` and proxies `/api` → backend; host `/` is empty (404)

Switch UI stack via compose `UI_MODULE` / `UI_RUNTIME` / `UI_MOUNT` (SPA: point at `dist/`).

## Deploy

**Production URL:** https://backend-java-spring.reference-app-copy.autotests.ai/frontend_typescript_react/

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/reference_app_copy/reference-app-copy` |
| `SERVER_PORT` | `8800` |
| `PUBLIC_URL` | `https://backend-java-spring.reference-app-copy.autotests.ai` |

**CD:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — `build` (image on GHA) → `deploy` (SSH `docker load` + `SKIP_BUILD=1` [`deploy/server-deploy.sh`](deploy/server-deploy.sh)).

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
