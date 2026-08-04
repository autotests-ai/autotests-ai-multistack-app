# frontend-typescript-react

Product UI — TypeScript + React (same screens as `frontend-javascript-react` / vanilla).

Vite + React 19 + React Router. Vite `base` is `./` (one dist under
`/{backend}/frontend-typescript-react/`); router `basename` and API paths come from
`lib/appBase.ts` (pathname matrix). Built on `@zero-design-system/react`, aliased to
committed [`frontend/_shared/frontend-react-ui`](../../_shared/frontend-react-ui/)
(refresh: `bash frontend/scripts/sync-react-ui.sh`).

RTL / Vitest live in [`src/test/`](src/test/) (`component_rtl`) — same module as the product,
like backend unit tests under `src/test/`.

Prod URL: `https://reference-app-copy.autotests.ai/{backend}/frontend-typescript-react/`  
(Host `/` is empty.)

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePage` | `reference-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button` |
| `/login` | `LoginPage` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPage` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

(Router basename strips the mount; header/`appPath` use absolute mount-prefixed paths.)

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`lib/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in React. `<AppHeader>`
publishes `window.headerConfig` and injects `js/header.js` from the mount
(`UI_RUNTIME` overlay in this module's nginx image).

## Scripts

```bash
npm run dev        # Vite on :9811 (relative base; mount via pathname / base tag)
npm run build      # → dist/ (packed by this module's Dockerfile)
npm run typecheck  # tsc --noEmit
npm test           # Vitest + RTL (src/test/)
```

`npm test` runs Vitest under `--no-experimental-webstorage`: Node 26 owns a `localStorage`
global that stays undefined without `--localstorage-file`, and Vitest keeps globals the
runtime already defined instead of installing the jsdom ones. Without the flag every test
touching `localStorage` fails on `Cannot read properties of undefined`.

## Build notes

- `outDir` is module-local `dist/` with `emptyOutDir: true`.
- Asset filenames are stable (unhashed).
- Peer CSS: lean DS from `_shared/frontend-javascript-app/css` + product CSS in `css/`.

## PWA baseline

| Output | Role |
|--------|------|
| `manifest.webmanifest` | `scope`/`start_url` under mount |
| `sw.js` | Precache app shell; `/api/*` denylisted |
| `public/icons/pwa-*.png` | Install + apple-touch icons |

SW registered in `src/pwa/registerServiceWorker.ts` under the product mount path.
