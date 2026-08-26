# frontend-javascript-vanilla

Product UI — plain HTML/JS (same screens as TypeScript React / Vue).

Static files + lean design-system runtime from
[`vendor/ds`](vendor/ds/)
(refresh: `bash frontend/scripts/sync-ds-runtime.sh`; overlaid in this module's Dockerfile). Header markup stays SSOT in `js/header.js`.

Prod URL: `https://autotests.ai/stack/{backend}/frontend-javascript-vanilla/`  
Local compose publish: `:9800`.

## Screens

| Page | Key testids |
|------|-------------|
| `index.html` | `multistack-layout`, health/items panels, `welcome-panel` with `logout-button` + `delete-account-button` |
| `login.html` | `login-panel`, form controls, `register-link`, `login-form-title` |
| `register.html` | `register-panel`, `register-login-input`, `register-password-input`, `confirm-password-input`, `register-submit-button`, `register-error-message`, `login-link`, `register-form-title` |

## i18n and theme

Copied dictionaries in [`js/i18n.js`](js/i18n.js) (`en` / `ru`) — not a shared lib, not i18next.
Default language is **en**. `header:lang-change` retitles nav (one `remountHeader`) and page copy;
`html[lang]` follows the toggle. Theme is owned by `header.js` (`zds-theme`); this module does
not reimplement it.

Selenide-facing English copy stays exact: validation messages, `Welcome, {username}!`,
`→ {status} | service: {service}`, form titles `Login Form` / `Register`. API payloads
(item names, health `status`/`service`, backend error text) are not translated. `data-testid`
values never change with language.

Login and register both redirect home when `authToken` is already present.

## Session panel

This module is the UX reference the other nine copy. The panel appears once
`GET /api/auth/me` returns a profile, and offers two actions that both end at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm` with `home.deleteConfirm` from the active dictionary first;
cancel sends no request. `ReferenceAuth.logout()` and `ReferenceAuth.deleteAccount()` are
twins: best-effort call, then the local token goes regardless of the outcome — a token the
server has already rejected must never keep the UI signed in.

## Icons

`icons/pwa-192.png` (from UI runtime overlay) is the apple-touch / install icon —
there is no separate `icon-192.png`.
