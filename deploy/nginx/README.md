# Host nginx (prod)

**Canonical URLs:** [autotests.ai/stack/](https://autotests.ai/stack/) (matrix board) · [autotests.ai/stack/backend-java-spring/frontend-typescript-react/](https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/) (app) · `/stack/{backend}/api/`.

**Retire hosts:** `reference-app-copy.autotests.ai`, `reference-app.autotests.ai` → **301** to `https://autotests.ai/stack$request_uri` (generated vhost).

Generate from SSOT:

```bash
python frontend/scripts/sync-stack-matrix.py
python deploy/nginx/render_vhosts.py
```

Outputs in `deploy/nginx/generated/`:

| File | Role |
|------|------|
| `reference-app-copy.autotests.ai.conf` | Retire vhost (301 → autotests.ai/stack/…) |
| `autotests.ai-stack-upstreams.conf` | `upstream` blocks — include at `http{}` in autotests.ai |
| `autotests.ai-stack-routes.conf` | `location` blocks — include inside autotests.ai `server{}` |
| `autotests.ai-stack-board.conf` | `/stack/` matrix board + shared `/stack/js|css` + `matrix.json` + `/{pair}/stack` 404 — include **before** stack-routes |
| `autotests.ai-server-stack.snippet.conf` | Wiring for autotests.ai `server{}`: legacy `/backend-` 301, then board, then routes |

On box3 the live vhost **includes** generated board+routes (do not paste board locations into the vhost). APP_DIR: `/home/autotests_ai_multistack/autotests-ai-multistack-app`.

Apply on box3 (retire vhost + drop the old `reference-app` proxy to `:8083`):

```bash
sudo cp deploy/nginx/generated/reference-app-copy.autotests.ai.conf \
  /etc/nginx/sites-available/reference-app-copy.autotests.ai
sudo ln -sfn /etc/nginx/sites-available/reference-app-copy.autotests.ai \
  /etc/nginx/sites-enabled/reference-app-copy.autotests.ai
sudo rm -f /etc/nginx/sites-enabled/reference-app
sudo nginx -t && sudo systemctl reload nginx
```

Certs: copy host → `live/reference-app-copy.autotests.ai/`; old host → `live/autotests.ai/` (SAN includes `reference-app.autotests.ai`).
