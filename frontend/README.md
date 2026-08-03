# Frontend

UI by **language** → **UI stack** → product module + co-located component tests.

```
frontend/
  scripts/                         # wire-ui, catalog sync (not product pages)
  _shared/
    frontend_javascript_app/       # lean DS runtime for product UI (committed)
    frontend_javascript_embed/     # full DS symlinks (wire-ui) — catalog only
  _catalog/
    frontend_javascript_preview/   # DS component catalog for browser @Tag(component)
  javascript/
    react/
      frontend_javascript_react/
      tests_javascript_react-testing-library/
    vanilla/
      frontend_javascript_vanilla/   # default app pages (was static)
      # later: tests_javascript_vanilla_… (component)
  typescript/
    react/
      frontend_typescript_react/
      tests_typescript_react-testing-library/
    vanilla/
      frontend_typescript_vanilla/
      # later: tests_typescript_vanilla_… (component)
```

## Product vs shared

| Kind | In URL matrix? | Examples |
|------|----------------|----------|
| Product UI | yes | `frontend_*_react`, `frontend_*_vanilla` |
| Component tests (jsdom) | no | `tests_*_react-testing-library` |
| Shared / catalog | no | `_shared/app`, `_shared/embed`, `_catalog/preview` |

## Prod routing (planned)

```
https://{backend}.reference-app-copy.autotests.ai/{frontend}/
```

Example: `https://backend_java_spring.reference-app-copy.autotests.ai/frontend_typescript_react`

- subdomain → backend stack  
- path → product frontend module  

Deploy: root `docker-compose.yml` sets `UI_MODULE` / `UI_RUNTIME`; the backend Dockerfile packs
those paths only (no stack name hard-coded). Switch the compose args to deploy another frontend.
