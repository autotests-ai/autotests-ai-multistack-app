# frontend-typescript-react

Product UI — TypeScript + React (same screens as vanilla / Vue).  
`frontend-javascript-react/` is the JavaScript twin — same screens, no TypeScript.

Vite + React 19 + React Router. Vite `base` is `./` (one dist under
`/{backend}/frontend-typescript-react/`); router `basename` and API paths come from
`lib/appBase.ts` (pathname matrix). Built on `@zero-design-system/react`, aliased to
committed [`frontend/_shared/frontend-react-ui`](../../_shared/frontend-react-ui/)
(refresh: `bash frontend/scripts/sync-react-ui.sh`).

RTL / Vitest live in [`src/test/`](src/test/) (`component_rtl`) — same module as the product,
like backend unit tests under `src/test/`.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-typescript-react/`  
(Host `/` is empty.)

## Routing — data router, not `<BrowserRouter>` + `<Routes>`

`src/routes.tsx` holds plain route objects; `main.tsx` feeds them to
`createBrowserRouter(routes, { basename: APP_BASE })` and renders a single
`<RouterProvider>`. `App` is the layout route — the header mounts once and `<Outlet />`
swaps the page under it.

This is the react-router 7 data-router API, and the reason it is worth the extra file: the
same `routes` array is what `createMemoryRouter` replays in `src/test/App.test.tsx`, so
routing is declared once instead of once for the browser and once for the tests. Loaders
and actions become available on the same objects if a screen ever needs them; nothing here
uses them yet.

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePage` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `/login` | `LoginPage` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPage` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

(Router basename strips the mount; header/`appPath` use absolute mount-prefixed paths.)

`appBase.ts` reads the mount off the pathname in the same order as the boot script in
`index.html`: `/{backend}/{frontend}` → bare `/{frontend}` → document root. The root case is
what the container publish-port (`:9811`) and a bare Vite root serve, so the basename there
is empty — a mount-shaped one matches nothing and the router renders an empty page.

## Session panel

Visible only once `GET /api/auth/me` returned a profile. Two actions, both ending in the
same logged-out state at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm('Delete this account? This cannot be undone.')` first;
cancel sends no request. Both calls are best effort and both drop the local token even when
the API fails — a token the server has already rejected must never keep the UI signed in.

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`lib/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in React. `<AppHeader>`
publishes `window.headerConfig` and injects `js/header.js` from the mount
(`UI_RUNTIME` overlay in this module's nginx image).

**`npm run dev` alone is not a full product stand:** Vite does not serve
`js/header.js` / header templates. Use Docker/compose (or the monorepo
`python scripts/stands/ensure.py autotests-ai-multistack-app`) so the image overlay provides
the runtime. Without it the SPA mounts but the header script 404s.

## Scripts

```bash
npm run dev        # Vite on :9811 — conflicts with compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run typecheck  # tsc --noEmit
npm run lint       # Biome check (src + configs)
npm test             # Vitest + RTL (src/test/)
npm run test:coverage # same run + v8 coverage → coverage/ (lcov + HTML)
npm run test:smoke   # only suites tagged `smoke` (Vitest 4 --tagsFilter)
```

Coverage (RTL / jsdom): [`COVERAGE.md`](COVERAGE.md) — `@vitest/coverage-v8`; `npm run test:coverage` writes `coverage/lcov.info` and `coverage/index.html`. Playwright / Selenide e2e = **N/A** for the % gate.

`smoke` is declared in `vitest.config.ts` (`test.tags`) and applied to the `App` suite —
the shell mounts and every route resolves. Vitest 4 runs with `strictTags` on, so a tag the
config does not declare fails the run instead of quietly matching nothing.

If compose already holds `:9811`, either stop that service or run Vite with
`vite --port <free>` — do not kill a live stand from an active chat.

`npm test` runs Vitest under `--no-experimental-webstorage`: Node 26 owns a `localStorage`
global that stays undefined without `--localstorage-file`, and Vitest keeps globals the
runtime already defined instead of installing the jsdom ones. Without the flag every test
touching `localStorage` fails on `Cannot read properties of undefined`.

## Toolchain pin

Vite **6.3.x** / `@vitejs/plugin-react` **4.6.x** / Vitest **3.2.x** / jsdom **26.x** —
aligned with monorepo `projects/design-system-home/react-ui` and `docs/rag/config/react-toolchain.md`
(Node 26 + TypeScript 7.0.2). Major bumps (Vite 8 / Vitest 4) stay a coordinated
monorepo change, not a solo product bump.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`
  via `src/styles.ts` (single CSS entry — react-ui components do not side-import styles).

## PWA baseline

| Output | Role |
|--------|------|
| `manifest.webmanifest` | `scope`/`start_url` under mount |
| `sw.js` | Precache app shell; `/api/*` denylisted |
| `public/icons/pwa-*.png` | Install + apple-touch (`icons/pwa-192.png`) |

SW registered in `src/pwa/registerServiceWorker.ts` under the product mount path.
