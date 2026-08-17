# frontend-javascript-react

Product UI — **JavaScript + React** (same screens as vanilla / TS React / Vue).
The JS twin of [`frontend-typescript-react/`](../../typescript/frontend-typescript-react/):
same markup, same copy, same behaviour — plain JavaScript with JSX instead of TypeScript.

Plain JS by design: `.jsx` app files, no `tsconfig.json`, no `typecheck` script, no `@types/*`.
Vite + React 19 + React Router. Vite `base` is `./` (one dist under
`/{backend}/frontend-javascript-react/`); router `basename` and API paths come from
`lib/appBase.js` (pathname matrix). Built on `@zero-design-system/react`, aliased to
committed [`frontend/_shared/frontend-react-ui`](../../_shared/frontend-react-ui/)
(refresh: `bash frontend/scripts/sync-react-ui.sh`). That vendored package is TypeScript
and Vite compiles it straight from this JS project — the alias is all the wiring needed.

RTL / Vitest live in [`src/test/`](src/test/) (`component_rtl`) — same module as the product,
like backend unit tests under `src/test/`.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-javascript-react/`
(Host `/` is empty.)

## Routing — data router, not `<BrowserRouter>` + `<Routes>`

`src/routes.jsx` holds plain route objects; `main.jsx` feeds them to
`createBrowserRouter(routes, { basename: APP_BASE })` and renders a single
`<RouterProvider>`. `App` is the layout route — the header mounts once and `<Outlet />`
swaps the page under it.

This is the react-router 7 data-router API, and the reason it is worth the extra file: the
same `routes` array is what `createMemoryRouter` replays in `src/test/App.test.jsx`, so
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

`appBase.js` reads the mount off the pathname in the same order as the boot script in
`index.html`: `/{backend}/{frontend}` → bare `/{frontend}` → document root. The root case is
what the container publish-port (`:9801`) and a bare Vite root serve, so the basename there
is empty — a mount-shaped one matches nothing and the router renders an empty page.

## Session panel

Rendered on `/` only once `GET /auth/me` returned a profile. Both actions live in this one
panel and both land on `/login`:

| Button | testid | Endpoint | Meaning |
|--------|--------|----------|---------|
| Logout (`btn--primary`) | `logout-button` | `POST /api/auth/logout` | Ends this session; the account stays |
| Delete account (`btn--danger`) | `delete-account-button` | `DELETE /api/auth/me` | **Account deletion, not logout** — the user row is gone server-side |

Delete account first asks `window.confirm('Delete this account? This cannot be undone.')`.
Cancel returns immediately: no request, session kept, no navigation.

`logout()` and `deleteAccount()` in `lib/auth.js` are twins and both **best effort** — fire the
request with the bearer token, swallow any failure, then always drop the local token. A dead
token must never keep the UI signed in.

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`lib/messages.js`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`,
  the delete-account confirm copy.

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
npm run dev        # Vite on :9801 — conflicts with compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run lint       # Biome check (src + configs)
npm test           # Vitest + RTL (src/test/)
```

No `typecheck` script: this module is plain JavaScript. Contracts are documented with JSDoc
in `lib/` and enforced by the suites in `src/test/`, not by `tsc`.

If compose already holds `:9801`, either stop that service or run Vite with
`vite --port <free>` — do not kill a live stand from an active chat.

`npm test` runs Vitest under `--no-experimental-webstorage`: Node 26 owns a `localStorage`
global that stays undefined without `--localstorage-file`, and Vitest keeps globals the
runtime already defined instead of installing the jsdom ones. Without the flag every test
touching `localStorage` fails on `Cannot read properties of undefined`.

## Toolchain pin

Vite **6.3.x** / `@vitejs/plugin-react` **4.6.x** / Vitest **3.2.x** / jsdom **26.x** —
aligned with monorepo `projects/design-system-home/react-ui` and `docs/rag/config/react-toolchain.md`
(Node 26). Major bumps (Vite 8 / Vitest 4) stay a coordinated monorepo change, not a solo
product bump.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`
  via `src/styles.js` (single CSS entry — react-ui components do not side-import styles).

## PWA baseline

| Output | Role |
|--------|------|
| `manifest.webmanifest` | `scope`/`start_url` under mount |
| `sw.js` | Precache app shell; `/api/*` denylisted |
| `public/icons/pwa-*.png` | Install + apple-touch (`icons/pwa-192.png`) |

SW registered in `src/pwa/registerServiceWorker.js` under the product mount path.
