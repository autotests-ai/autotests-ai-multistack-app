# reference-app-copy

Clean teaching fork of [reference-app](https://github.com/autotests-ai/reference-app) — **3-folder layout**, deploy-only CI (block 1).

GitHub: **[github.com/autotests-ai/reference-app-copy](https://github.com/autotests-ai/reference-app-copy)** · monorepo: `projects/reference-home/reference-app-copy/`

Production: [reference-app-copy.autotests.ai](https://reference-app-copy.autotests.ai)

## Layout (3 product folders)

```
reference-app-copy/
  frontend/          # UI by language → framework
  backend/           # server by language → stack (+ build scripts/)
  tests/             # automation by language → runner (not backend unit tests)
  deploy/            # prod nginx, smoke, health
  .github/workflows/ # deploy.yml only (runnable)
```

| Zone | Current modules | Future slots (empty until needed) |
|------|-----------------|-----------------------------------|
| **frontend/javascript/** | `embed`, `static`, `preview` | `vanilla`, `jquery` |
| **frontend/typescript/** | `react` | `angular` |
| **backend/java/** | `backend-java-spring` | `kotlin-spring`, … |
| **tests/java/** | `tests-java-gradle` | TestNG, … |
| **tests/javascript/** | `tests-javascript-playwright` | Cypress, … |
| **tests/python/** | `tests-python-selenium` | playwright, … |

Path SSOT for scripts: `backend/scripts/paths.sh`

### Unit tests vs pyramid tests

| Kind | Where | Example |
|------|-------|---------|
| **Unit** (backend) | `backend/java/backend-java-spring/src/test/java/` | `ItemServiceTest`, JaCoCo 100% gate |
| **Pyramid** (block 2) | `tests/java/tests-java-gradle/` | api, e2e, component, visual |
| **Other languages** | `tests/javascript/`, `tests/python/` | Playwright, pytest |

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

**Autodeploy:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — push `main` or `workflow_dispatch`.

Image build on GHA (`linux/amd64`) → `docker save|ssh load` → on-server `git fetch` → `compose up --no-build` → health → smoke.

### GitHub secrets & variables

| Name | Kind | Value |
|------|------|-------|
| `DEPLOY_SSH_KEY` | secret | deploy SSH key for `selenoid@212.92.101.15` |
| `DEPLOY_HOST` | variable | `212.92.101.15` |
| `DEPLOY_USER` | variable | `selenoid` |

Sibling prod (do not touch): [reference-app.autotests.ai](https://reference-app.autotests.ai) · port `8083`.

### Deferred (block 2+)

- Workflows: [`.github/workflows/_deferred/`](.github/workflows/_deferred/)
- Legacy samples: [`tests/_deferred/`](tests/_deferred/) (notifications, Jenkinsfile, old java sample)

## Related

- Upstream: [autotests-ai/reference-app](https://github.com/autotests-ai/reference-app)
- CI roles: `docs/rag/config/ci-workflow-ethalon.md` (monorepo)
