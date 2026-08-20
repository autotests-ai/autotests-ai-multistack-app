# frontend-javascript-angular

Product UI — **real Angular written in plain JavaScript**. Same screens, copy and
testids as `frontend-typescript-react` / `frontend-typescript-vue`, with no TypeScript
anywhere in the module: no `.ts` sources, no `tsconfig.json`, no `typecheck` script.

Vite + Angular 22 (standalone components, `@angular/router`) under
`/frontend-javascript-angular/`. Lean design-system CSS from
[`vendor/ds`](vendor/ds/);
thin Angular wrappers for Panel / Button / PlaqueField / AppHeader (header markup stays
SSOT in `js/header.js`).

Vitest + Angular `TestBed` live in [`src/test/`](src/test/) — same module as the product.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-javascript-angular/`  
(Host `/` is empty.) Dev/preview port: **9802**.

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomeComponent` | `multistack-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button`, `delete-account-button` |
| `/login` | `LoginComponent` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterComponent` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

`APP_BASE` from the path matrix becomes the router's `APP_BASE_HREF`, so the router sees
`/login` while the address bar shows `/{backend}/frontend-javascript-angular/login`; the
header and `appPath()` use the absolute mount.

## Session panel

Visible only once `GET /api/auth/me` returned a profile. Two actions, both ending in the
same logged-out state at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm('Delete this account? This cannot be undone.')`
first; cancel sends no request. Both calls are best effort and both drop the local token
even when the API fails — a token the server has already rejected must never keep the UI
signed in.

## Angular without TypeScript

Angular is normally inseparable from TypeScript, because the AOT compiler *is* a
TypeScript program. This module runs the **JIT** compiler instead, which reads the same
`@Component({...})` metadata at runtime:

- `src/main.js` imports `@angular/compiler` **first**. That import publishes the compiler
  facade `@angular/core` looks for; without it every component throws on first render.
  `@angular/compiler` is a runtime `dependency` here, not a devDependency, and it is why
  the bundle is ~1.2 MB.
- Templates are inline `template:` strings only. `templateUrl` needs the AOT resource
  loader and will not work.
- **Babel**, not esbuild, transpiles `src/**/*.js`: esbuild only understands decorators in
  TypeScript, and the bundler cannot even parse them. `babel-decorators.js` runs
  `@babel/plugin-proposal-decorators` in **legacy** mode (the shape `@angular/core`'s
  `makeDecorator` expects — the decorator is called with the class and returns it) plus
  `@babel/plugin-transform-class-properties` in `loose` mode (assignment semantics, i.e.
  what `useDefineForClassFields: false` gives a TypeScript build). Both `vite.config.js`
  and `vitest.config.js` import it, so decorators are gone before anything else sees the
  file.
- The plugin is **`@rolldown/plugin-babel`**, not `vite-plugin-babel`: the latter does
  `import babel from '@babel/core'`, and Babel 8 is ESM-native with named exports only, so
  loading the config throws before Vite starts. The Rolldown plugin is the Vite 8 / Babel 8
  pairing and never reads `babel.config.*`, which is why the plugin list is passed inline
  and there is no `babel.config.json` in this module any more.
- **Dependency injection uses `inject()`, never constructor parameters.** Constructor DI
  relies on TypeScript's `emitDecoratorMetadata` to record parameter types, and Babel
  cannot emit that — there is no type information to emit. `inject()` in a field
  initialiser needs no metadata and is the modern Angular idiom anyway.
- Each class carries **exactly one decorator**. Inputs and outputs are declared in the
  `@Component` metadata (`inputs: [...]`, `outputs: [...]`) instead of with `@Input()` /
  `@Output()` property decorators, which keeps the Babel surface to class decorators only.

Signal-based `input()` / `model()` are deliberately **not** used: the compiler discovers
those by statically analysing the field initialiser, which is an AOT-only capability.

## Signals, not zone.js

The app is **zoneless** (`provideZonelessChangeDetection()`), and component state is
`signal()`s rather than plain fields. Both halves of that are load-bearing:

- zone.js cannot see native `async`/`await`. Angular's own CLI downlevels `await` to
  something zone.js can patch; Babel here does not, so a `fetch().then()` chain would
  settle invisibly and the view would keep rendering `→ Checking health…`.
- Mutating a plain field marks no view dirty, so Angular's targeted-refresh change
  detection skips it — even an explicit `detectChanges()` is a no-op.

Signals notify change detection directly, which makes correctness independent of how a
promise was created. They are also the closest analogue to `useState` in the React module
and `ref()` in the Vue one, so the three read almost line for line.

## Components

`data-testid`, extra classes and `hidden` are plain attributes and native property
bindings at the call site, never component inputs — Angular reflects a static attribute
that matches an input onto the element too, which would emit a stray lowercase `testid`
next to `data-testid`. Literal input values are therefore bound (`[title]="'Session'"`).

| Wrapper | Selector | Why |
|---------|----------|-----|
| `app-panel` | element, `.panel` on the host | `panel.css` / `auth.css` need `.panel__bar` and `.panel__body` as direct children and `.auth-panel.panel` as one element |
| `app-button` | `button[app-button]` | the host **is** the native `<button>`, so `type="submit"` still submits |
| `app-plaque-field` | `label[app-plaque-field]` | the host **is** the `<label>`; `plaque-field.css` targets `> .plaque-field__control` |
| `app-header` | element, `id="app-header"` on the host | that id is the mount `js/header.js` looks up |

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`app/lib/messages.js`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in Angular. `<app-header>`
publishes `window.headerConfig` and injects `js/header.js` from the mount (`vendor/ds`
overlay in this module's nginx image).

## Scripts

```bash
npm run dev      # Vite on :9802 — conflicts with compose publish of the same port
npm run build    # → dist/ (packed by this module's Dockerfile)
npm run preview  # serve dist/ on :9802
npm test         # Vitest + Angular TestBed (src/test/)
```

There is no `typecheck` script: this module has no TypeScript.

**`npm run dev` alone is not a full product stand:** Vite does not serve `js/header.js`
or the header templates. Use Docker/compose (or monorepo
`python scripts/stands/ensure.py autotests-ai-multistack-app`) for the `vendor/ds` overlay.

`npm test` runs Vitest under `--no-experimental-webstorage` for the same reason as the
React module: on Node 26 the runtime's own empty `localStorage` global wins over the
jsdom one.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable and unhashed (`assets/index.js`, `assets/index.css`), and
  `index.html` pins them to the absolute mount during parse — see the boot script and
  the `pin-mount-assets` plugin in `vite.config.js`.
- Routes reference their components eagerly (no `loadComponent`) so the build stays a
  single chunk, which is what that pinning assumes.
- Peer CSS: lean DS from `vendor/ds/css` + product CSS in `css/`.
- Image build context is this folder (`docker build .`); no repo-root `COPY` of `_shared`.
- No PWA / service worker in this module.
