# frontend-typescript-react

Product UI — TypeScript + React (same screens as `frontend-javascript-react` / vanilla).

Vite + React 19 + React Router (`basename=/frontend-typescript-react/`). Built on
`@zero-design-system/react`, aliased to committed
[`frontend/_shared/frontend-react-ui`](../../../_shared/frontend-react-ui/)
(refresh: `bash frontend/scripts/sync-react-ui.sh`).

RTL / Vitest live in [`../frontend-typescript-react_testing_library/`](../frontend-typescript-react_testing_library/)
(`component_rtl`), not in this folder.

Prod URL: `https://{backend}.reference-app-copy.autotests.ai/frontend-typescript-react/`  
(Host `/` is empty.)

## Routes

| Route | Screen | Key testids |
|-------|--------|-------------|
| `/` | `HomePage` | `reference-layout`, `health-panel`/`health-status`, `items-list`/`item-row`, `welcome-panel`/`welcome-message`, `logout-button` |
| `/login` | `LoginPage` | `login-panel`, `login-form`, `login-input`, `password-input`, `submit-button`, `error-message`, `register-link`, `login-form-title` |
| `/register` | `RegisterPage` | `register-panel`, `register-form`, `confirm-password-input`, `submit-button`, `login-link`, `register-form-title` |

(Router basename strips the mount; header/`appPath` use absolute `/frontend-typescript-react/…`.)

## Contracts preserved for Selenide

- Every `data-testid` used by `tests/.../pages/*.java`.
- Exact strings: validation messages (`lib/messages.ts`), `Welcome, {username}!`,
  `→ {status} | service: {service}`, form titles `Login Form` / `Register`.

## Header

The design-system header is SSOT and is **not** reimplemented in React. `<AppHeader>`
publishes `window.headerConfig` and injects `js/header.js` from the mount
(`UI_RUNTIME` overlay in the web image).

## Scripts

```bash
npm run dev        # Vite dev server (base /frontend-typescript-react/)
npm run build      # → dist/ (packed by deploy/web multi-stage)
npm run typecheck  # tsc --noEmit
# npm test → run from ../frontend-typescript-react_testing_library/
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
