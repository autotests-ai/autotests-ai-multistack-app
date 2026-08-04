# frontend-typescript-vue

Product UI — TypeScript + Vue 3 (same screens as `frontend-typescript-react` / vanilla).

Vite + Vue 3 + Vue Router (`createWebHistory` under `/frontend-typescript-vue/`).
Lean design-system CSS from
[`frontend/_shared/frontend-javascript-app`](../../_shared/frontend-javascript-app/);
thin Vue wrappers for Panel / Button / PlaqueField / AppHeader (header markup stays SSOT in `js/header.js`).

Vitest + Testing Library live in [`src/test/`](src/test/) — same module as the product.

Prod URL: `https://{backend}.reference-app-copy.autotests.ai/frontend-typescript-vue/`  
(Host `/` is empty.)

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePage` | `reference-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button` |
| `/login` | `LoginPage` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPage` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

(Router history base strips the mount; header/`appPath` use absolute `/frontend-typescript-vue/…`.)

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`lib/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in Vue. `<AppHeader>`
publishes `window.headerConfig` and injects `js/header.js` from the mount
(`UI_RUNTIME` overlay in the web image).

## Scripts

```bash
npm run dev        # Vite dev server (base /frontend-typescript-vue/)
npm run build      # → dist/ (packed by deploy/web multi-stage)
npm run typecheck  # vue-tsc --noEmit
npm test           # Vitest + Testing Library (src/test/)
```

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`.

## PWA baseline

| Output | Role |
|--------|------|
| `manifest.webmanifest` | `scope`/`start_url` under mount |
| `sw.js` | Precache app shell; `/api/*` denylisted |
| `public/icons/pwa-*.png` | Install icons |

SW registered in `src/pwa/registerServiceWorker.ts` under the Vite base path.
