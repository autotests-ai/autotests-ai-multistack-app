# Frontend

UI by **language** → **UI stack** → product module (component tests co-located in `src/test/`).

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
    react/
      frontend-javascript-react/   # product + src/test/ (slot)
    vanilla/
      frontend-javascript-vanilla/   # default app pages (was static)
      # later: src/test/ for vanilla component checks
  typescript/
    react/
      frontend-typescript-react/   # product + src/test/ (component_rtl)
    vanilla/
      frontend-typescript-vanilla/
      # later: src/test/ for vanilla component checks
```

## Product vs shared

| Kind | In URL matrix? | Examples |
|------|----------------|----------|
| Product UI | yes | `frontend-*-react`, `frontend-*-vanilla` |
| Component tests (jsdom) | no | `frontend-*-react/src/test/` (Vitest + RTL) |
| Shared / catalog | no | `_shared/app`, `_shared/embed`, `_catalog/preview` |

## Prod routing

```
https://{backend}.reference-app-copy.autotests.ai/{frontend}/
```

Active: `https://backend-java-spring.reference-app-copy.autotests.ai/frontend-typescript-react/`  
Host `/` is empty (404). `/api/**` stays on the backend host root.

- subdomain → backend stack  
- path → product frontend module (`UI_MOUNT`)

Deploy: `deploy/web` multi-stage — Vite-build `UI_MODULE` (`frontend-typescript-react`) + overlay `UI_RUNTIME` into `UI_MOUNT`. Backend stays API-only.
