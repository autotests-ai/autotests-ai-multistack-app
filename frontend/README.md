# Frontend

UI by **language** → product module (component tests co-located in `src/test/`).
Stack is in the module name (`-react`, `-angular`, `-vue`, `-vanilla`).

```
frontend/
  scripts/                         # wire-ui, catalog sync (not product pages)
  _shared/
    frontend-javascript-app/       # lean DS runtime for product UI (committed)
    frontend-react-ui/             # vendored @zero-design-system/react (sync-react-ui.sh)
    frontend-javascript-embed/     # full DS symlinks (wire-ui) — catalog only
  _catalog/
    frontend-javascript-preview/   # DS component catalog for browser @Tag(component)
  javascript/
    frontend-javascript-react/     # product + src/test/ (slot)
    frontend-javascript-angular/   # product + src/test/ (slot)
    frontend-javascript-vue/       # product + src/test/ (slot)
    frontend-javascript-vanilla/   # active static app
  typescript/
    frontend-typescript-react/     # product + src/test/ (component_rtl)
    frontend-typescript-angular/   # product + src/test/ (slot)
    frontend-typescript-vue/       # product + src/test/ (component_vue)
    frontend-typescript-vanilla/   # product slot
```

## Product vs shared

| Kind | In URL matrix? | Examples |
|------|----------------|----------|
| Product UI | yes | `frontend-*-react`, `frontend-*-angular`, `frontend-*-vue`, `frontend-*-vanilla` |
| Component tests (jsdom) | no | `frontend-*-{react,angular,vue}/src/test/` |
| Shared / catalog | no | `_shared/app`, `_shared/embed`, `_catalog/preview` |

## Prod routing (per-frontend containers × N backends)

```
https://reference-app-copy.autotests.ai/{backend}/{frontend}/
```

- **One source tree** per frontend module — never duplicated per backend
- **One container/image per active frontend** ([`deploy/matrix.yaml`](../deploy/matrix.yaml))
- UI resolves `API_BASE = /{backend}/api` from the pathname — same `dist/` under every backend prefix

Active compose services: `frontend-typescript-react` (:9811), `frontend-typescript-vue` (:9813), `frontend-javascript-vanilla` (:9800).  
Slots are not deployed until `status: active` + Dockerfile.

Host `/` is empty (404). Host nginx ([`deploy/nginx/`](../deploy/nginx/)) strips `/{backend}/{frontend}` → `/` on that frontend container.

## Local ports

Canon in [`deploy/matrix.yaml`](../deploy/matrix.yaml): language base **+10**, stack **+1** from **9800**.  
Same numbers = compose publish ports (host nginx upstreams).

| Port | Module |
|------|--------|
| 9800 | `frontend-javascript-vanilla` |
| 9801–9803 | javascript react / angular / vue |
| 9810 | `frontend-typescript-vanilla` |
| 9811 | `frontend-typescript-react` |
| 9812 | `frontend-typescript-angular` |
| 9813 | `frontend-typescript-vue` |
