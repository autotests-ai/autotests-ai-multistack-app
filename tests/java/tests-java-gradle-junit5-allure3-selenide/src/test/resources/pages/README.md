# Page objects

**autotests-ai-multistack-app** — home page at app root. Resolved via `baseUrl` in `config/${env}.properties`.

| Page | Class | Open |
|------|-------|------|
| Home | `HomePage` | `open("")` → `GET /` |
| Login | `LoginPage` | `open("/login")` |

Post-auth state (welcome message, logout) lives on `HomePage` at `/`.

## Stands

`multistack_ci.properties`: `baseUrl=http://localhost:9821/` (stand-gateway-ci) · `multistack_prod.properties`: the deployed host.
