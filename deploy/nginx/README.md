# Host nginx (prod)

**Canonical URLs:** [autotests.ai/stack/](https://autotests.ai/stack/) — `/{backend}/{frontend}/` and `/{backend}/api/` under `/stack/`.

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
| `autotests.ai-stack-board.conf` | bare `/stack/` board + shared `/stack/js|css` — include **before** stack-routes |

Apply on box3:

```bash
sudo cp deploy/nginx/generated/reference-app-copy.autotests.ai.conf /etc/nginx/sites-available/
cd /opt/autotests-ai-app && sudo bash deploy/nginx/sync-nginx.sh
sudo nginx -t && sudo systemctl reload nginx
```
