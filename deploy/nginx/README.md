# Host nginx (prod)

One public host (`reference-app-copy.autotests.ai`):

- `/{backend}/api/**` → published backend port (8800 java · 8810 kotlin · 8820 flask · …)
- `/{backend}/{frontend}/**` → that frontend's publish port (9800 / 9811 / 9813 · …), strip `/{backend}/{frontend}` → `/`

Port canon: [`../matrix.yaml`](../matrix.yaml) · root README «Ports».

```bash
python deploy/nginx/render_vhosts.py
bash deploy/nginx/sync-nginx.sh
```

SSOT: [`../matrix.yaml`](../matrix.yaml) · template: [`vhost.template.conf`](vhost.template.conf)
