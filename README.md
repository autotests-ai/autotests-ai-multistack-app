# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

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
Hyphen **only** in compound tool names, e.g. `frontend_typescript_react-testing-library`, `tests_java_gradle_junit5_no-allure_selenide`.

Full test-module matrix: [tests/NAMING.md](tests/NAMING.md).

| Zone | Current modules | Future slots |
|------|-----------------|--------------|
| **frontend/javascript/** | `embed`, `static`, `preview` | `vanilla`, `jquery` |
| **frontend/typescript/** | `react-testing-library` | `angular` |
| **backend/java/** | `backend_java_spring` | `backend_kotlin_spring`, … |
| **tests/java/** | `tests_java_gradle_junit5_allure3_selenide` | junit4, testng, allure2, selenium, … — [tests/NAMING.md](tests/NAMING.md) |
| **tests/javascript/** | `tests_javascript_playwright` | Cypress, … |
| **tests/python/** | `tests_python_selenium` | playwright, … |

Path SSOT: `backend/scripts/paths.sh`

### Layers (block 2)

Canon: [tests/LAYERS.md](tests/LAYERS.md) · CI: [`.github/workflows/test.yml`](.github/workflows/test.yml)

| Job | Where |
|-----|-------|
| `unit_backend` | `backend/java/backend_java_spring/src/test/` |
| `unit_test-infra` | `…/tests/unit/testinfra/` (`@Layer("unit")` + `@Tag("test-infra")`) |
| `component_rtl` | `frontend/typescript/frontend_typescript_react-testing-library/` |
| `api` … `e2e` / `component_browser` / `visual` | `tests/java/tests_java_gradle_junit5_allure3_selenide/` |

## Quick start

```bash
./backend/scripts/sync-app-static.sh
docker compose up -d --build
curl -fsS http://localhost:8080/api/health
```

## Deploy

**Production URL:** https://reference-app-copy.autotests.ai

| Setting | Value |
|---------|-------|
| `APP_DIR` | `/home/reference_app_copy/reference-app-copy` |
| `SERVER_PORT` | `8084` |
| `PUBLIC_URL` | `https://reference-app-copy.autotests.ai` |

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
