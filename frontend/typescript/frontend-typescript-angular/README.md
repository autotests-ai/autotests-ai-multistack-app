# frontend-typescript-angular

Product UI — TypeScript + Angular 20 (same screens as `frontend-typescript-react` /
`frontend-typescript-vue` / vanilla).

Vite + standalone components + `@angular/router`, signals for local state, zoneless
change detection (`provideZonelessChangeDetection()` — no `zone.js`). Angular is compiled
under Vite by [`@analogjs/vite-plugin-angular`](https://analogjs.org), so the module builds
and tests exactly like the other bundled modules in the matrix.
Lean design-system CSS from
[`frontend/_shared/frontend-javascript-app`](../../_shared/frontend-javascript-app/);
the only local component wrappers are `Panel` (panel chrome) and `AppHeader`
(header markup stays SSOT in `js/header.js`).

Vitest + `@angular/core/testing` TestBed live in [`src/test/`](src/test/) — same module as
the product.

Prod URL: `https://reference-app-copy.autotests.ai/{backend}/frontend-typescript-angular/`  
(Host `/` is empty.) Dev/preview port: **9812**.

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePageComponent` | `reference-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
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
(`UI_RUNTIME` overlay in this module's nginx image).

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
`python scripts/stands/ensure.py reference-app-copy`) for the `UI_RUNTIME` overlay.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the React
module: on Node 26 the runtime's own empty `localStorage` global wins over the jsdom one.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`.
- `css/angular-hosts.css` is the only Angular-specific stylesheet: it drops the extra
  component host elements (`<app-root>`, `<app-home-page>`, …) out of layout so the shared
  CSS sees the same markup tree as the React / Vue modules.
- `css/app.css` adds `.panel[hidden] { display: none }` on top of the copy shared with the
  Vue module. Without it the author-level `.panel { display: flex }` beats the UA `[hidden]`
  rule and the Session panel stays on screen for anonymous visitors.
- Angular 20 (not 21/22) is pinned on purpose: `@angular/build` — required by the Analog
  Vite plugin — pins `vitest ^4` from v21 on, and the matrix is on Vitest 3 / TypeScript 5.9.

No PWA/service worker in this module (the React and Vue modules own that baseline).
