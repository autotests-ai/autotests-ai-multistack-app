# frontend-javascript-vue

Product UI — JavaScript + Vue 3 (same screens as `frontend-typescript-vue` / vanilla).

Vite + Vue 3 + Vue Router (`createWebHistory` under `/frontend-javascript-vue/`).
Lean design-system CSS from
[`frontend/_shared/frontend-javascript-app`](../../_shared/frontend-javascript-app/);
thin Vue wrappers for Panel / Button / PlaqueField / AppHeader (header markup stays SSOT in `js/header.js`).

Plain JavaScript twin of [`frontend-typescript-vue`](../../typescript/frontend-typescript-vue/):
SFCs use `<script setup>` with runtime `defineProps`, every `src/lib/*` is `.js`, and there is
no `tsconfig.json`, no `vue-tsc` and no `typecheck` script.

Vitest + Testing Library live in [`src/test/`](src/test/) — same module as the product.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-javascript-vue/`  
(Host `/` is empty.)

## vue-router 5

The v5 major changed nothing in `src/router/index.js` — this is still the recommended
shape, and `createMemoryHistory` is still what the specs mount against:

```js
export const router = createRouter({
  history: createWebHistory(`${APP_BASE}/`),
  routes: [ /* … */ ],
});
```

v5 does ship a new matcher and an `experimental_createRouter`, but both are exported under
`EXPERIMENTAL_*` names — not something a teaching stand should pin its routing to.

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePage` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `/login` | `LoginPage` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPage` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

(Router history base strips the mount; header/`appPath` use absolute `/frontend-javascript-vue/…`.)

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
- Exact strings: validation messages (`lib/messages.js`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in Vue. `<AppHeader>`
publishes `window.headerConfig` and injects `js/header.js` from the mount
(`UI_RUNTIME` overlay in this module's nginx image).

## Scripts

```bash
npm run dev        # Vite on :9803 — conflicts with compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm test           # Vitest + Testing Library (src/test/)
```

**`npm run dev` alone is not a full product stand:** Vite does not serve
`js/header.js` / header templates. Use Docker/compose (or monorepo
`python scripts/stands/ensure.py autotests-ai-multistack-app`) for the `UI_RUNTIME` overlay.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the React
module: on Node 26 the runtime's own empty `localStorage` global wins over the jsdom one.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`.

## PWA baseline

| Output | Role |
|--------|------|
| `manifest.webmanifest` | `scope`/`start_url` under mount |
| `sw.js` | Precache app shell; `/api/*` denylisted |
| `public/icons/pwa-*.png` | Install + apple-touch (`icons/pwa-192.png`) |

SW registered in `src/pwa/registerServiceWorker.js` under the Vite base path.
