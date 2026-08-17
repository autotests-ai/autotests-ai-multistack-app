# frontend-react-ui

Vendored copy of monorepo `projects/design-system-home/react-ui/src` for standalone Docker/GHA builds of
`autotests-ai-multistack-app` (no monorepo checkout on the build host).

**Deliberately test-stripped:** the sync excludes `*.test.tsx` / `test/`. Component quality
is guaranteed upstream in monorepo `projects/design-system-home/react-ui` (its own Vitest+RTL suite); this copy
is a build artifact, not a source of truth — do not edit by hand, re-run the sync instead.

Refresh from monorepo root:

```bash
bash frontend/scripts/sync-react-ui.sh
```

Consumed via Vite alias `@zero-design-system/react` → `src/index.ts`.
