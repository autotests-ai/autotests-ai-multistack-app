# deploy/web (retired)

Shared `web` image removed. Each active frontend is its own compose/nginx container:

| Service | Module Dockerfile | Publish port |
|---------|-------------------|--------------|
| `frontend-javascript-vanilla` | [`frontend/javascript/frontend-javascript-vanilla/Dockerfile`](../../frontend/javascript/frontend-javascript-vanilla/Dockerfile) | 9800 |
| `frontend-typescript-react` | [`frontend/typescript/frontend-typescript-react/Dockerfile`](../../frontend/typescript/frontend-typescript-react/Dockerfile) | 9811 |
| `frontend-typescript-vue` | [`frontend/typescript/frontend-typescript-vue/Dockerfile`](../../frontend/typescript/frontend-typescript-vue/Dockerfile) | 9813 |

Host nginx (`../nginx/`) proxies `/{backend}/{frontend}/` to the matching publish port. SSOT: [`../matrix.yaml`](../matrix.yaml).
