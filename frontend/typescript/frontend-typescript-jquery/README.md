# frontend-typescript-jquery

Product UI — **TypeScript + jQuery**, same screens as `frontend-javascript-vanilla` /
`frontend-typescript-react`. Three real HTML documents (no client-side router), compiled
by a multi-page Vite build.

`jquery` and `@types/jquery` are ordinary npm dependencies, imported as ES modules
(`import $ from 'jquery'`) and bundled by Vite — no CDN tag, no vendored copy. That is the
difference from `frontend-javascript-jquery`, which ships static with a vendored jQuery.

Lean design-system CSS comes from
[`vendor/ds`](vendor/ds/) and
the header runtime (`js/header.js` + its templates) from the vendor/ds overlay in this
module's nginx image. Header markup stays SSOT in `js/header.js`.

Vitest + jsdom specs live in [`src/test/`](src/test/) — same module as the product.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-typescript-jquery/`  
Local compose publish / dev / preview port: `:9814`. (Host `/` is empty.)

## Screens

| Document | URL | Key testids |
|----------|-----|-------------|
| `index.html` | `/` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `login.html` | `/login` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `register.html` | `/register` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

The app links to the extensionless `/login` and `/register`; nginx resolves them with
`try_files $uri $uri.html`. Login and register both redirect home when a token is already
stored.

| Source | Role |
|--------|------|
| `src/appBase.ts` | Path-matrix resolution — `APP_BASE`, `API_BASE`, `BACKEND_ID`, `appPath`, `apiUrl` |
| `src/auth.ts` | Typed auth client (session, validation, error copy) |
| `src/i18n/` | Copied `en`/`ru` dictionaries (own `home.blurb`); `header:lang-change` + `html[lang]` |
| `src/messages.ts` | Default-en snapshots for auth unit tests |
| `src/headerConfig.ts` | `window.headerConfig` + the `js/header.js` embed; nav labels follow lang |
| `src/home.ts` · `src/login.ts` · `src/register.ts` | One jQuery DOM layer per document |

## Session panel

Visible only once `GET /api/auth/me` returned a profile. Two actions, both ending in the
same logged-out state at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account** — not a logout. The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm` with `home.deleteConfirm` from the active dictionary first;
cancel sends no request and keeps the session. Both calls are best effort and both drop the
local token even when the API fails — a token the server has already rejected must never
keep the UI signed in.

## i18n and theme

Copied dictionaries in [`src/i18n/`](src/i18n/) (`en` / `ru`) — not a shared lib, not i18next.
`home.blurb` is this module's (`TypeScript jQuery demo`). Default language is **en**.
`header:lang-change` retitles nav (one `remountHeader`) and page copy; `html[lang]` follows
the toggle. Theme is owned by `header.js` (`zds-theme`); this module does not reimplement it.

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java` (never translated).
- Exact strings (English default): validation messages (`src/messages.ts` / `src/i18n/en.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service} | frontend: {UI_MOUNT}`, form titles
  `Login Form` / `Register`.
- API payloads (item names, health `status`/`service`, backend error text) are
  not translated. Nav labels follow `header:lang-change` via one `remountHeader`.

## Scripts

```bash
npm run dev        # Vite on :9814 — conflicts with the compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run preview    # serve dist/ on :9814
npm run typecheck  # tsc --noEmit
npm test           # Vitest + jsdom (src/test/)
```

`dev` and `preview` serve `/js/*` and `/templates/*` straight from
`vendor/ds` and resolve `/login` → `login.html`, so both
behave like the nginx image instead of 404-ing the header runtime.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the React
and Vue modules: on Node 26 the runtime's own empty `localStorage` global wins over the
jsdom one. Specs mount the shipped document body (`index.html?raw`) and drive the page
through jQuery, so markup drift fails the suite.

## Build notes

- Three Rollup inputs (`index.html`, `login.html`, `register.html`); shared code and CSS
  land in one chunk each.
- `base: './'` — the same `dist/` works at the publish port and under
  `/{backend}/frontend-typescript-jquery/`.
- `outDir` is module-local `dist/` with `emptyOutDir: true`; asset filenames are stable
  (unhashed) under `assets/`.
- Peer CSS: lean DS from `vendor/ds/css` + product CSS in `css/`,
  both imported through `src/styles.ts`.
- Image build context is this folder (`docker build .`); no repo-root `COPY` of `_shared`.
