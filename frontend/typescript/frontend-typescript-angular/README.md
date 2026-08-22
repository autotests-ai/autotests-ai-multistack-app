# frontend-typescript-angular

Product UI — TypeScript + Angular 22 (same screens as `frontend-typescript-react` /
`frontend-typescript-vue` / vanilla).

TypeScript here is pinned to **6.0.3**, not the 7.0.2 the rest of the matrix uses:
`@angular/compiler-cli@22` needs `typescript >=6.0 <6.1`, and TypeScript 7 has no Compiler
API for it to build against. Forcing 7 breaks compilation, not just the peer check.

Vite + standalone components + `@angular/router`, signals for local state, zoneless
change detection (`provideZonelessChangeDetection()` — no `zone.js`). Angular is compiled
under Vite by [`@analogjs/vite-plugin-angular`](https://analogjs.org), so the module builds
and tests exactly like the other bundled modules in the matrix.
Lean design-system CSS from
[`vendor/ds`](vendor/ds/);
the only local component wrappers are `Panel` (panel chrome) and `AppHeader`
(header markup stays SSOT in `js/header.js`).

Vitest + `@angular/core/testing` TestBed live in [`src/test/`](src/test/) — same module as
the product.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-typescript-angular/`  
(Host `/` is empty.) Dev/preview port: **9812**.

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePageComponent` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `/login` | `LoginPageComponent` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPageComponent` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

`APP_BASE` resolved from the path matrix is provided as `APP_BASE_HREF`, so
`router.navigate(['/login'])` lands on `/{backend}/frontend-typescript-angular/login` and a
deep link there resolves back to the route (nginx `try_files` → `index.html`). Header and
`appPath` use the same absolute mount.

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
- Exact strings: validation messages (`app/lib/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in Angular.
`<app-header>` publishes `window.headerConfig` and injects `js/header.js` from the mount
(`vendor/ds` overlay in this module's nginx image).

## Scripts

```bash
npm run dev        # Vite on :9812 — conflicts with compose publish of the same port
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run typecheck  # ngc --noEmit — TypeScript *and* Angular template type checking
npm test           # Vitest + TestBed (src/test/)
```

`npm run typecheck` uses `ngc` rather than `tsc`: only the Angular compiler type-checks the
inline templates (`strictTemplates`), and the Vite build does not fail on template
diagnostics.

**`npm run dev` alone is not a full product stand:** Vite does not serve
`js/header.js` / header templates. Use Docker/compose (or monorepo
`python scripts/stands/ensure.py autotests-ai-multistack-app`) for the `vendor/ds` overlay.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the React
module: on Node 26 the runtime's own empty `localStorage` global wins over the jsdom one.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `vendor/ds/css` + product CSS in `css/`.
- Image build context is this folder (`docker build .`); no repo-root `COPY` of `_shared`.
- `css/angular-hosts.css` is the only Angular-specific stylesheet: it drops the extra
  component host elements (`<app-root>`, `<app-home-page>`, …) out of layout so the shared
  CSS sees the same markup tree as the React / Vue modules.
- After the shared matrix is on **Vite 8 + Vitest 4** (`docs/rag/config/react-toolchain.md`),
  this module tracks **Angular 22** + **TypeScript 6.0.3** (Angular peer `>=6 <6.1`; **not** TS 7 —
  Compiler API returns in TS 7.1).

No PWA/service worker in this module (the React and Vue modules own that baseline).
