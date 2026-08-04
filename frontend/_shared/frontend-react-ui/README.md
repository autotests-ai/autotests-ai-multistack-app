# frontend-react-ui

Vendored copy of monorepo `packages/react-ui/src` for standalone Docker/GHA builds of
`reference-app-copy` (no monorepo checkout on the build host).

Refresh from monorepo root:

```bash
bash frontend/scripts/sync-react-ui.sh
```

Consumed via Vite alias `@zero-design-system/react` → `src/index.ts`.
