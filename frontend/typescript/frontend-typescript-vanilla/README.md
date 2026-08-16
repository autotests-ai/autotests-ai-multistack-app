# frontend-typescript-vanilla

Product UI — the same Multistack screens in **TypeScript with no framework**.

A real multi-page app: `index.html`, `login.html` and `register.html` are three
separate documents, there is no client-side router, and the DOM is driven by
`document.querySelector` + `addEventListener`. TypeScript is the only tooling
difference from [`frontend-javascript-vanilla`](../../javascript/frontend-javascript-vanilla/),
which this module is a port of — Vite compiles `src/*.ts` into one script per page.

Lean design-system CSS and the header runtime come from
[`frontend/_shared/frontend-javascript-app`](../../_shared/frontend-javascript-app/)
(the `${UI_RUNTIME}` overlay, laid down by this module's Dockerfile). Header markup
stays SSOT in `js/header.js` and is never reimplemented here.

Vitest + jsdom live in [`src/test/`](src/test/) — same module as the product.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-typescript-vanilla/`
(Host `/` is empty.)
Local compose publish: `:9810`. Dev/preview: `:9810`.

## Screens

| Page | Module | Key testids |
|------|--------|-------------|
| `index.html` | `src/home.ts` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `login.html` | `src/login.ts` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `register.html` | `src/register.ts` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |
| header | `src/header.ts` | `header-nav-home`, `header-nav-login`, `header-nav-register` |

Login and register both redirect home when a token is already present.

## Session panel

Hidden until `GET /api/auth/me` returns a profile. Two actions, both ending in the
same logged-out state at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm('Delete this account? This cannot be undone.')`
first; cancel sends no request and keeps the session. `logout()` and `deleteAccount()`
in `src/auth.ts` are twins: best-effort call, then the local token goes regardless of
the outcome — a token the server has already rejected must never keep the UI signed in.
`deleteAccount()` never touches the logout endpoint.

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`src/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service} | frontend: {UI_MOUNT}`, form titles
  `Login Form` / `Register`.

## Runtime path matrix

`src/appBase.ts` resolves the mount from `window.location.pathname`, so one `dist/`
is served under every backend prefix:

| Pathname | `APP_BASE` | `API_BASE` | Token key |
|----------|-----------|-----------|-----------|
| `/{backend}/{frontend}/…` | `/{backend}/{frontend}` | `/{backend}/api` | `authToken:{backend}` |
| `/{frontend}/…` | `/{frontend}` | `/api` | `authToken` |
| anything else (publish port, dev, jsdom) | `''` | `/api` | `authToken` |

## Scripts

```bash
npm run dev        # Vite on :9810 — conflicts with the compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run preview    # serve dist/ on :9810
npm run typecheck  # tsc --noEmit
npm test           # Vitest + jsdom (src/test/)
npm run test:smoke # only suites tagged `smoke` (Vitest 4 --tagsFilter)
```

`smoke` is declared in `vitest.config.ts` (`test.tags`) and applied to the `home page`
suite. Vitest 4 runs with `strictTags` on, so a tag the config does not declare fails the
run instead of quietly matching nothing.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the
React and Vue modules: on Node 26 the runtime's own empty `localStorage` global wins
over the jsdom one.

Because there is no component framework, the tests drive the modules directly: the
harness mounts the shipped HTML body into jsdom (`?raw` import, so a markup change
cannot silently drift from the tests), imports the page module, and dispatches real
clicks and submits with `fetch` and `window.confirm` stubbed.

## Build notes

- `build.rolldownOptions.input` lists all three HTML entry points; each page gets
  `assets/{index,login,register}.js` and they share `assets/shared.js`. Vite 8 bundles with
  Rolldown, so the option is `rolldownOptions` (`rollupOptions` still works but is
  deprecated) and the shared chunk is declared as `output.codeSplitting.groups` rather than
  the deprecated `output.manualChunks` callback.
- `base: './'` — relative asset URLs work under any `/{backend}/{frontend}/` prefix.
  Safe here because every page is a real file at the dist root; there are no nested
  routes to break the relative resolution.
- Asset filenames are stable (unhashed), `outDir` is module-local `dist/`.
- Product CSS lives in `public/css/` so Vite copies it verbatim: `app.css` `@import`s
  `panel.css` / `button.css` and `page.css` `@import`s `tokens.css`, all of which
  arrive with the overlay. The design-system `<link>` tags in the HTML are likewise
  left untouched — `vite build` prints
  `css/….css doesn't exist at build time, it will remain unchanged to be resolved at
  runtime` for each of them, which is the intended outcome, not a warning to fix.
- `js/header.js` is overlay-owned too, so it cannot be a static `<script>` tag —
  Vite resolves those at build time and would fail on the missing file.
  `src/header.ts` publishes `window.headerConfig` and appends the module script
  instead, which is the same wiring one step later.
- `npm run dev` / `npm run preview` serve the overlay's `css/`, `js/` and
  `templates/` straight from `frontend/_shared/frontend-javascript-app` (see
  `overlayRuntime()` in `vite.config.ts`), so both are complete product stands
  without Docker.

## nginx

`try_files $uri $uri.html $uri/ /index.html` — the `$uri.html` step is what resolves
the extensionless URLs the app navigates to (`/login`, `/register`) to their real
documents. Without it they fall through to the SPA-style `/index.html` fallback and
every auth link lands on the home page.

## Icons

`icons/qa-guru-logo.svg` / `icons/pwa-192.png` are referenced exactly as in
`frontend-javascript-vanilla`; they ship with the deploy overlay, not this module.
