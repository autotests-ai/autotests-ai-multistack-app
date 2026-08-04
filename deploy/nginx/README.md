# Host nginx (prod)

One public host (`reference-app-copy.autotests.ai`):

- `/{backend}/api/**` → published backend port (8800 java · 8810 kotlin · 8820 flask · …)
- `/{backend}/{frontend}/**` → that frontend's publish port (9800 / 9811 / 9813 · …), strip `/{backend}/{frontend}` → `/`

The vhost is a plain file kept in git — edit [`reference-app-copy.autotests.ai.conf`](reference-app-copy.autotests.ai.conf) by hand and keep its upstream ports in sync with `docker-compose.yml`.

Apply on the host:

```bash
sudo cp deploy/nginx/reference-app-copy.autotests.ai.conf /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx
```

Deploy does not touch nginx — routing changes are a separate, manual step.
