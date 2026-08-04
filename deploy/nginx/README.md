# Host nginx (prod)

One public host (`reference-app-copy.autotests.ai`):

- `/{backend}/api/**` → published backend port
- `/{backend}/frontend-*/**` → shared `web` port (strip backend prefix)

```bash
python deploy/nginx/render_vhosts.py
bash deploy/nginx/sync-nginx.sh
```

SSOT: [`../matrix.yaml`](../matrix.yaml) · template: [`vhost.template.conf`](vhost.template.conf)
