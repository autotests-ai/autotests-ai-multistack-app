# frontend-javascript-jquery

Product UI — the same Multistack screens as
[`frontend-javascript-vanilla`](../frontend-javascript-vanilla/), written in
**JavaScript + jQuery 4**.

Three real HTML documents loading plain `<script>` files — no bundler, no build step.
The design-system layer (tokens, `button.css`, `panel.css`, `header.css` and the
`js/header.js` runtime) comes from
[`vendor/ds`](vendor/ds/)
(refresh: `bash frontend/scripts/sync-ds-runtime.sh`),
overlaid in the module Dockerfile. Header markup stays SSOT in `js/header.js`.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-javascript-jquery/`  
Local compose publish: `:9804`.

## jQuery is vendored — the page never touches a CDN

`vendor/jquery.min.js` is the unmodified `dist/jquery.min.js` of jQuery **4.0.0**, taken
from the npm package (`npm i && npm run vendor:jquery`) and committed here. Every page
loads it with `<script src="vendor/jquery.min.js">`, so the container serves the library
from its own origin and works with no outbound network.

The vendored file, not the dependency range, is what runs — in the browser *and* in the
tests, which load the same file through `src/test/helpers/page.js`. Bumping `jquery` in
`package.json` without running `npm run vendor:jquery` therefore changes nothing anywhere,
which is exactly how this module sat on jQuery 3.7.1 while claiming 4.

Nothing here needed a jQuery 4 migration: the pages only use `$()` selectors, `.on()`,
`.text()` / `.html()` / `.addClass()` / `.prop()` and `$.map`, all of which survived the
major. The removed 3.x surface (`$.trim`, `$.isFunction`, `$.type`, `.bind()`,
`.delegate()`, `.hover()`, …) was never used, because the API layer is `fetch` and jQuery
is only the DOM idiom.

## npm is dev-only tooling

The shipped image is static files. `package.json` exists for Vitest and the local dev
server only — nothing in it runs at container build time or in the browser, and the
Dockerfile deletes `package.json`, `package-lock.json`, `node_modules/`,
`vitest.config.js`, `src/` and `scripts/` from the served root.

| Command | What it does |
|---------|--------------|
| `npm install` | dev dependencies (Vitest, jsdom, Testing Library, jQuery source) |
| `npm test` | `vitest run` — jsdom component tests, no backend needed |
| `npm run dev` / `npm run preview` | serves the module layered over the UI runtime on `:9804`, with the same `try_files` chain as nginx |
| `npm run build` | no-op — static module, nothing to bundle |
| `npm run vendor:jquery` | re-copies `node_modules/jquery/dist/jquery.min.js` into `vendor/` |

## Screens

| Page | Key testids |
|------|-------------|
| `index.html` | `multistack-layout`, `health-panel` / `health-status`, `items-list` / `item-row`, `welcome-panel` |
| `login.html` | `login-panel`, `login-form`, `login-input`, `password-input`, `error-message`, `register-link` |
| `register.html` | `register-panel`, `confirm-password-input`, `error-message`, `login-link` |

Login and register both redirect home when `authToken` is already present.

## Files

| Path | Role |
|------|------|
| `js/app-base.js` | path-matrix resolution — `APP_BASE` / `API_BASE` / `UI_MOUNT`, `appPath()`, `apiUrl()`. Plain JS, loaded before jQuery |
| `js/auth.js` | `window.ReferenceAuth` — validation, login/register, profile, logout, `deleteAccount`. Transport is `fetch`, not `$.ajax` |
| `js/app.js` | home screen in jQuery idiom — `$(function () { … })`, `$('[data-testid="…"]')`, `.on('click', …)`, `.text()`, `.html()`, `.prop('hidden', false)` |
| `js/login.js`, `js/register.js` | the two forms, same jQuery idiom |
| `vendor/jquery.min.js` | vendored jQuery 4.0.0 — refresh with `npm run vendor:jquery` after bumping the dependency, otherwise the pages keep loading the old copy |

## Session panel

Rendered only when `GET /api/auth/me` returned a profile, and it carries **both** buttons:

- **Logout** → `POST /api/auth/logout` → drops the local token → `/login`.
- **Delete account** → `window.confirm('Delete this account? This cannot be undone.')`.
  Cancel returns immediately: no request, session kept. OK → `DELETE /api/auth/me` →
  drops the local token → `/login`.

`DELETE /api/auth/me` is **account deletion, not logout** — the user row is gone
server-side and the logout endpoint is never called. Like logout it is best effort: the
local session is dropped even when the call fails, so a dead token can never keep the UI
signed in.

## Tests

`src/test/` — Vitest + jsdom, `fetch` and `window.confirm` stubbed, never a real backend.
The suites load the shipped `js/*.js` files into the jsdom window the way a `<script>` tag
would and drive them against the `<main>` markup read out of the real HTML pages, so the
tests break when the shipped markup or testids drift.

| Suite | Covers |
|-------|--------|
| `auth.test.js` | `window.ReferenceAuth` surface, validation copy, network errors, logout, `deleteAccount` (token / no token / 401 / network) |
| `home.test.js` | health + items panels, empty and error states, invalid session, Session panel with both buttons, logout, delete confirmed / cancelled / refused |
| `login.test.js` | panel markup, redirect when signed in, validation, success redirect, wrong credentials, network error |
| `register.test.js` | panel markup, redirect when signed in, password mismatch, success, refused registration |
