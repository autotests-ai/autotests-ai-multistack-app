# Host nginx (cells)

**Canonical URLs:** [autotests.ai/stack/](https://autotests.ai/stack/) (matrix board — landing compose gateway, not teaching FE) · [autotests.ai/stack/backend-java-spring/frontend-typescript-react/](https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/) (cell) · `/stack/{backend}/api/`.

**Stage:** [stage.autotests.ai/stack/](https://stage.autotests.ai/stack/) — those same paths, ports `publish_port+10000`, upstream prefix `stage_`. Host vhosts (landing owns `/` and `/stack/`): `autotests-ai-app/deploy/nginx/`. This tree renders **cells only**.

Generate from SSOT:

```bash
python deploy/nginx/render_vhosts.py
```

Outputs in `deploy/nginx/generated/`:

| File | Role |
|------|------|
| `autotests.ai-stack-upstreams.conf` | `upstream` blocks — include at `http{}` in autotests.ai |
| `autotests.ai-stack-routes.conf` | cell `location` blocks — include inside autotests.ai `server{}` **after** landing `/stack/` locations |
| `stage.autotests.ai-stack-upstreams.conf` | stage `upstream` (`stage_*`, ports +10000) — include at `http{}` in stage vhost |
| `stage.autotests.ai-stack-routes.conf` | stage cell `location` — include inside stage `server{}` |
| `autotests.ai-server-stack.snippet.conf` | Wiring leftover: legacy `/backend-` 301, then routes (no board include) |

`*-stack-board.conf` is not generated. Inbox overlay is gone; `/stack/` board is the landing SPA.

On box3 the live vhost includes generated **routes** (do not paste board locations into the vhost; do not `proxy_pass` board to `frontend_typescript_react`). APP_DIR: `/home/autotests_ai_multistack/autotests-ai-multistack-app`.

Retired product FQDNs stay disabled (do not re-enable leftover `sites-enabled` names).
