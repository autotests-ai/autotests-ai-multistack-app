# Frontend

UI by **language** → product module (component tests co-located in `src/test/`).
Stack is in the module name (`-react`, `-angular`, `-vue`, `-vanilla`).

```
frontend/
  scripts/                         # wire-ui, sync helpers (not product pages)
  _shared/
    frontend-javascript-app/       # lean DS runtime for product UI (committed)
    frontend-react-ui/             # vendored @zero-design-system/react (sync-react-ui.sh)
    frontend-javascript-embed/     # full DS symlinks (wire-ui)
  javascript/
    frontend-javascript-vanilla/   # static app — UX reference for the other nine
    frontend-javascript-react/     # product + src/test/
    frontend-javascript-angular/   # product + src/test/ (JIT + Babel decorators)
    frontend-javascript-vue/       # product + src/test/
    frontend-javascript-jquery/    # static app + src/test/ (vendored jQuery)
  typescript/
    frontend-typescript-vanilla/   # product + src/test/ (multi-page, no framework)
    frontend-typescript-react/     # product + src/test/ (component_rtl) — deploy default
    frontend-typescript-angular/   # product + src/test/
    frontend-typescript-vue/       # product + src/test/ (component_vue)
    frontend-typescript-jquery/    # product + src/test/ (multi-page)
```

All ten are `status: active` in [`deploy/matrix.yaml`](../deploy/matrix.yaml) — there are no
frontend slots left. Each is an **independent copy**: same screens, same `data-testid`
contract, same auth surface, no shared application code. A change to the contract is a
change in ten places, on purpose.

## Toolchain — why the configs look like this in 2026

Node 26, **Vite 8**, **Vitest 4**, Angular 22, Vue 3 + vue-router 5, React 19 + react-router 7,
jQuery 4. Canon and pins: monorepo [`docs/rag/config/react-toolchain.md`](../../../../docs/rag/config/react-toolchain.md).

- **Rolldown is the bundler.** Vite 8 replaced Rollup with Rolldown, so `build.rollupOptions`
  is deprecated in favour of **`build.rolldownOptions`** — that is the name every
  `vite.config.*` here uses. Manual chunking moved too: `output.manualChunks` →
  `output.codeSplitting.groups` (see `frontend-typescript-vanilla`).
- **Allure reporter is an imported instance**, not `['allure-vitest/reporter', …]`. The string
  form is resolved outside the module directory and can pick up an `allure-vitest` hoisted
  higher in the tree; that copy then injects its own setup file and test runner, and a second
  Vitest runtime in one worker fails the whole suite before a single test collects.
- **TypeScript is pinned per module, not globally.** `typescript@7.0.2` everywhere except
  Angular (`6.0.3`, `@angular/compiler-cli` needs `>=6 <6.1`) and TypeScript Vue (`6.0.3`,
  `vue-tsc` still loads `typescript/lib/tsc`, which TS 7 no longer exports).
- **`--no-experimental-webstorage`** is in every `test` script: on Node 26 the runtime's own
  empty `localStorage` global wins over the jsdom one.
- **Test tags** (Vitest 4) mark the smoke suite in the two reference modules
  (`frontend-typescript-vanilla`, `frontend-typescript-react`): `npm run test:smoke`.

## Product vs shared

| Kind | In URL matrix? | Examples |
|------|----------------|----------|
| Product UI | yes | `frontend-*-react`, `frontend-*-angular`, `frontend-*-vue`, `frontend-*-vanilla`, `frontend-*-jquery` |
| Component tests (jsdom) | no | `frontend-*/src/test/` — every module but static `frontend-javascript-vanilla` |
| Shared | no | `_shared/app`, `_shared/embed`, `_shared/react-ui` |

## Session panel — the auth contract every module implements

The home screen's `welcome-panel` appears only after `GET /api/auth/me` returns a profile,
and offers two actions that both end in the logged-out state at `/login`:

| Button | testid | Variant | Request | Meaning |
|--------|--------|---------|---------|---------|
| Logout | `logout-button` | `btn--primary` | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| Delete account | `delete-account-button` | `btn--danger` | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm('Delete this account? This cannot be undone.')` first —
cancel sends no request and keeps the session. Both calls are best effort and both drop the
local token even when the API fails, so a token the server has already rejected can never
keep the UI signed in. Backend contract: [`backend/java/backend-java-spring/README.md`](../backend/java/backend-java-spring/README.md).

## Prod routing (per-frontend containers × N backends)

```
https://autotests.ai/stack/{backend}/{frontend}/
```

- **One source tree** per frontend module — never duplicated per backend
- **One container/image per active frontend** ([`deploy/matrix.yaml`](../deploy/matrix.yaml))
- UI resolves `API_BASE = /{backend}/api` from the pathname — same `dist/` under every backend prefix

Every module has a compose service and an image. CI builds, Sonar-scans and deploys exactly
one of them — `frontend-typescript-react` (:9811), the module `APP_URL` / `UI_URL` point at.
The other nine build locally via `docker compose build <service>` and run their component
suites on every PR.

Host `/` is empty (404). Host nginx ([`deploy/nginx/`](../deploy/nginx/)) strips `/{backend}/{frontend}` → `/` on that frontend container.

## Local ports

Canon in [`deploy/matrix.yaml`](../deploy/matrix.yaml): language base **+10**, stack **+1** from **9800**.  
Same numbers = compose publish ports (host nginx upstreams).

| Port | Module |
|------|--------|
| 9800 | `frontend-javascript-vanilla` |
| 9801–9803 | javascript react / angular / vue |
| 9804 | `frontend-javascript-jquery` |
| 9810 | `frontend-typescript-vanilla` |
| 9811 | `frontend-typescript-react` |
| 9812 | `frontend-typescript-angular` |
| 9813 | `frontend-typescript-vue` |
| 9814 | `frontend-typescript-jquery` |
