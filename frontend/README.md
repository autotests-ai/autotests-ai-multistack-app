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

## Prod routing (shared static × N backends)

```
https://reference-app-copy.autotests.ai/{backend}/{frontend}/
```

- **One source tree** per frontend module — never duplicated per backend
- **One `web` image** packs all `status: active` mounts ([`deploy/matrix.yaml`](../deploy/matrix.yaml))
- UI resolves `API_BASE = /{backend}/api` from the pathname — same `dist/` under every backend prefix

Active mounts in `web`: `frontend-typescript-react`, `frontend-typescript-vue`, `frontend-javascript-vanilla`.  
Slots are not deployed until they have a buildable `dist/` / static tree.

Host `/` is empty (404). `/{backend}/api/**` is routed by host nginx ([`deploy/nginx/`](../deploy/nginx/)), not by the static image.

## Local ports

Canon in [`deploy/matrix.yaml`](../deploy/matrix.yaml): language base **+10**, stack **+1** from **9800**.

| Port | Module |
|------|--------|
| 9800 | `frontend-javascript-vanilla` |
| 9801–9803 | javascript react / angular / vue |
| 9810 | `frontend-typescript-vanilla` |
| 9811 | `frontend-typescript-react` (`npm run dev`) |
| 9812 | `frontend-typescript-angular` |
| 9813 | `frontend-typescript-vue` (`npm run dev`) |

Packaged static for all mounts → shared `web` on **8701** (host nginx strips `/{backend}/` in prod).
