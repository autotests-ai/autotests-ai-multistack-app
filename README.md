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
| `APP_DIR` | `/home/selenoid/reference-app-copy` |
| `SERVER_PORT` | `8084` |
| `PUBLIC_URL` | `https://reference-app-copy.autotests.ai` |

**Autodeploy:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

### GitHub secrets & variables

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | deploy SSH key for `selenoid@212.92.101.15` |
| `DEPLOY_HOST` | variable | `212.92.101.15` |
| `DEPLOY_USER` | variable | `selenoid` |

Sibling prod (do not touch): [reference-app.autotests.ai](https://reference-app.autotests.ai) · port `8083`.

### Deferred (block 2+)

- Workflows: [`.github/workflows/_deferred/`](.github/workflows/_deferred/)
- Legacy: [`tests/_deferred/`](tests/_deferred/)

## Related

- Upstream: [autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)
