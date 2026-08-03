# Frontend

UI slices by **language** → **stack/framework**.

```
frontend/
  javascript/
    frontend-javascript-embed/     # design-system symlinks (wire-ui)
    frontend-javascript-static/    # legacy static overlay (app pages)
    frontend-javascript-preview/   # component catalog snapshot (:3000)
    # future: frontend-javascript-vanilla, frontend-javascript-jquery
  typescript/
    frontend-typescript-react/     # React SPA (Vite) → backend static
    # future: frontend-typescript-angular
```

Materialize into backend: `backend/scripts/sync-app-static.sh`
