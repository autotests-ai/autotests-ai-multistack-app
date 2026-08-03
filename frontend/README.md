# Frontend

UI slices by **language** → **stack** (underscores between segments; hyphen only in compound tool names).

```
frontend/
  javascript/
    frontend_javascript_embed/       # design-system symlinks (wire-ui)
    frontend_javascript_static/      # legacy static overlay (app pages)
    frontend_javascript_preview/     # component catalog snapshot (:3000)
    # future: frontend_javascript_vanilla, frontend_javascript_jquery
  typescript/
    frontend_typescript_react-testing-library/   # React SPA + Vitest/RTL
    # future: frontend_typescript_angular
```

Materialize into backend: `backend/scripts/sync-app-static.sh`
