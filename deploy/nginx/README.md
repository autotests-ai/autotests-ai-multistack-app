# Host nginx (prod)

**Canonical URLs:** [autotests.ai/stack/](https://autotests.ai/stack/) (matrix board — sources in `projects/autotests-ai-home/stack-matrix/overlay/`; nginx still proxies to teaching FE until landing takes it) · [autotests.ai/stack/backend-java-spring/frontend-typescript-react/](https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/) (app) · `/stack/{backend}/api/`.

**Stage:** [stage.autotests.ai/stack/](https://stage.autotests.ai/stack/) — те же paths, порты `publish_port+10000`, upstream prefix `stage_`. Vhost: `stage.autotests.ai.vhost.conf` (не generated). Includes из **prod** APP_DIR `generated/stage.autotests.ai-stack-*.conf`.

Generate from SSOT:

```bash
python frontend/scripts/sync-stack-matrix.py
python deploy/nginx/render_vhosts.py
```

Outputs in `deploy/nginx/generated/`:

| File | Role |
|------|------|
| `autotests.ai-stack-upstreams.conf` | `upstream` blocks — include at `http{}` in autotests.ai |
| `autotests.ai-stack-routes.conf` | `location` blocks — include inside autotests.ai `server{}` |
| `autotests.ai-stack-board.conf` | `/stack/` matrix board + shared `/stack/js|css|templates` + `matrix.json` + `/{pair}/stack` 404 — include **before** stack-routes |
| `stage.autotests.ai-stack-upstreams.conf` | stage `upstream` (`stage_*`, ports +10000) — include at `http{}` in stage vhost |
| `stage.autotests.ai-stack-routes.conf` | stage `location` — include inside stage `server{}` |
| `stage.autotests.ai-stack-board.conf` | stage `/stack/` board (`stage_frontend_typescript_react`) |
| `autotests.ai-server-stack.snippet.conf` | Wiring for autotests.ai `server{}`: legacy `/backend-` 301, then board, then routes |

On box3 the live vhost **includes** generated board+routes (do not paste board locations into the vhost). APP_DIR: `/home/autotests_ai_multistack/autotests-ai-multistack-app`.

Retired product FQDNs stay disabled (do not re-enable leftover `sites-enabled` names).
