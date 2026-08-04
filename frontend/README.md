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
https://{backend}.reference-app-copy.autotests.ai/{frontend}/
```

- **One source tree** per frontend module — never duplicated per backend
- **One `web` image** packs all `status: active` mounts ([`deploy/matrix.yaml`](../deploy/matrix.yaml))
- UI uses relative `/api/*` → whichever backend hostname you opened

Active mounts in `web`: `frontend-typescript-react`, `frontend-typescript-vue`, `frontend-javascript-vanilla`.  
Slots are not deployed until they have a buildable `dist/` / static tree.

Host `/` is empty (404). `/api/**` is routed by edge (local) or host nginx (prod), not by the static image.
