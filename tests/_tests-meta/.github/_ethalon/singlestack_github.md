# Default-stack CI (takeaway) — not the matrix orchestrator

SSOT: [`singlestack_github.yml`](singlestack_github.yml).

Runnable copy (teaching name `ci.yml`):

`projects/autotests-ai-multistack-home/ai-first-student-workspace/.github/workflows/ci.yml`

`render.sh --preset singlestack` copies this file there.

**Do not** copy this over `autotests-ai-multistack-app/.github/workflows/ci.yml` (matrix: sidecars, languages, TestOps, Sonar, stage mutex).

The **job graph** follows the matrix clone ([example run](https://github.com/autotests-ai/autotests-ai-multistack-app/actions/runs/32279974182)): split unit, `build-*`, deploy FE/BE, live api/e2e after SSH. Takeaway stays thin (flat paths, no TestOps / Sonar / trigger lanes / GHCR). Host still `compose up --build` from the checkout.

## Stands

| Слово | `-Denv=` | URL |
|-------|----------|-----|
| pipeline | `ci` | compose on the laptop (`qa-run-stand`) / mock compose on the GHA runner |
| stage | `stage` | [https://stage.ai-first.autotests.ai/](https://stage.ai-first.autotests.ai/) |
| prod | `prod` | [https://ai-first.autotests.ai/](https://ai-first.autotests.ai/) |

Subdomain, not `/stack/backend-java-spring/frontend-typescript-react/`. SPA talks to `/api` at origin — same shape as `deploy/ci/nginx.conf`.

Until DNS + host nginx + repo vars exist, `deploy-*` skip (`vars.DEPLOY_HOST` / `vars.DEPLOY_APP_DIR` / `vars.STAGE_HOST` empty). PR still runs backend-unit → integration, frontend-unit → ui-mock, harness.

## Repo vars / secrets (takeaway GitHub)

| Key | Role |
|-----|------|
| `DEPLOY_HOST` | SSH host for prod compose (Box3 `212.92.101.15`) |
| `DEPLOY_USER` | SSH user (`autotests_ai_multistack`) |
| `DEPLOY_APP_DIR` | git checkout path on the VM; **required** for prod deploy (no default). Course GitHub: [qa-guru/ai-first-student-workspace](https://github.com/qa-guru/ai-first-student-workspace) |
| `DEPLOY_COMPOSE_PROJECT` | `docker compose --project-name` so prod ≠ matrix and ≠ stage (`ai-first-prod`) |
| `DEPLOY_COMPOSE_ENV_FILE` | `--env-file` with remapped ports. Matrix already binds `:8800`/`:9811`; stage matrix binds `:18800`/`:19821`. Course remap: gateway `29821`, backend `28800` |
| `DEPLOY_HEALTH_URL` | remapped backend, e.g. `http://127.0.0.1:28800/api/health` |
| `STAGE_HOST` / `STAGE_USER` / `STAGE_APP_DIR` | stage twin clone |
| `STAGE_COMPOSE_PROJECT` | `ai-first-stage` |
| `STAGE_COMPOSE_ENV_FILE` | stage remap: gateway `39821`, backend `38800` |
| `STAGE_HEALTH_URL` | `http://127.0.0.1:38800/api/health` |
| `secrets.DEPLOY_SSH_KEY` | SSH private key for `DEPLOY_USER` |
| `secrets.SELENOID_REMOTE_URL` | hub URL **with** creds — prod/stage e2e |

Host: clone takeaway **once** per stand, then CI `git fetch` + `checkout --force $SHA` + `docker compose --project-name … --env-file … up -d --build <services>`.

Same Box3 as the matrix stack: do **not** reuse ports `8800`/`9811`/`9821` (prod matrix) or `18800`/`19811`/`19821` (stage matrix). Public nginx `proxy_pass` the remapped gateway.

## Host nginx (sketch)

```nginx
server {
    listen 443 ssl http2;
    server_name ai-first.autotests.ai;
    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:29821;
    }
}
```

Stage: `server_name stage.ai-first.autotests.ai` → `127.0.0.1:39821`. Live files: `projects/infra-home/raw/selectel/box3/ai-first.autotests.ai.nginx`.

## Jobs (pyramid + CD)

`backend-unit-tests` → `integration-tests` → `build-backend` (`docker compose build`, main / dispatch).  
`frontend-unit-tests` + `tests-harness` → `ui-mock-tests` → `build-frontend`.  
`tests-harness` also gates `api-tests-stage` / `api-tests` / `e2e-tests-stage` / `e2e-tests`. Not folded into those jobs: JaCoCo of the tests module stays here.  
`deploy-backend-stage` (postgres + backend) / `deploy-frontend-stage` (frontend + `stand-gateway-ci`) → `api-tests-stage` → `e2e-tests-stage`.  
`deploy-backend` / `deploy-frontend` after stage e2e (or when stage jobs skipped) → `api-tests` (`api & smoke`) → `e2e-tests` (`e2e & smoke`, Selenoid).  
`publish-allure-report` — one Allure box (lock + generate gate; Pages soft, `contents: write` literal). No TestOps / Telegram / Sonar.

Pipeline api/e2e (`-Denv=ci`) are **local**, not GHA jobs.

Pins: `_ethalon/gha-actions.yaml` (checkout@v7, setup-java@v5, setup-node@v6 / Node 26, setup-chrome@v2.1.2, appleboy/ssh-action@v1.2.5).
