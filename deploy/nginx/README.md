# Host nginx (prod)

Per-backend vhosts: `/api` → published backend port, `/frontend-*` → shared `web` port.

```bash
python deploy/nginx/render_vhosts.py
bash deploy/nginx/sync-nginx.sh
```

SSOT: [`../matrix.yaml`](../matrix.yaml) · template: [`vhost.template.conf`](vhost.template.conf)
