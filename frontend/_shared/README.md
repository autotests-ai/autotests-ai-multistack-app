# Shared frontend assets

Not part of the product URL matrix.

| Folder | Role |
|--------|------|
| `frontend-javascript-app/` | Lean DS runtime for product UI (committed; packed by Docker as `UI_RUNTIME`) |
| `frontend-react-ui/` | Vendored `@zero-design-system/react` sources for standalone Vite/Docker builds (`sync-react-ui.sh`) |
| `frontend-javascript-embed/` | Full design-system via `frontend/scripts/wire-ui.sh` (catalog / local DS work) |
