# TypeScript frontends

All five are active products with their own image and matrix port. Same screens, same
`data-testid` contract, same auth surface — each written in its own stack's idiom, never
sharing app code with a sibling.

| Path | Role | Port |
|------|------|------|
| `frontend-typescript-vanilla/` | Product UI — TS, no framework (Vite multi-page) | 9810 |
| `frontend-typescript-vanilla/src/test/` | Vitest + jsdom | — |
| `frontend-typescript-react/` | Product UI — TS + React (deploy default) | 9811 |
| `frontend-typescript-react/src/test/` | Vitest + RTL (`component_rtl`) | — |
| `frontend-typescript-angular/` | Product UI — TS + Angular standalone | 9812 |
| `frontend-typescript-angular/src/test/` | Vitest + Angular TestBed | — |
| `frontend-typescript-vue/` | Product UI — TS + Vue 3 | 9813 |
| `frontend-typescript-vue/src/test/` | Vitest + Testing Library (`component_vue`) | — |
| `frontend-typescript-jquery/` | Product UI — TS + jQuery (Vite multi-page) | 9814 |
| `frontend-typescript-jquery/src/test/` | Vitest + jsdom | — |

`frontend-typescript-react` is the module CI builds, Sonar-scans and deploys
(`APP_URL` / `UI_URL`); the rest are built locally and run their suites on every PR.

Component tests live inside the product module (`src/test/`), like backend unit tests.
