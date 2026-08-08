# frontend-javascript-vanilla

Product UI — plain HTML/JS (same screens as TypeScript React / Vue).

Static files + lean design-system runtime from
[`frontend/_shared/frontend-javascript-app`](../../_shared/frontend-javascript-app/)
(overlaid in the module Dockerfile). Header markup stays SSOT in `js/header.js`.

Prod URL: `https://reference-app-copy.autotests.ai/{backend}/frontend-javascript-vanilla/`  
Local compose publish: `:9800`.

## Screens

| Page | Key testids |
|------|-------------|
| `index.html` | `reference-layout`, health/items panels, `welcome-panel` with `logout-button` + `delete-account-button` |
| `login.html` | `login-panel`, form controls, `register-link` |
| `register.html` | `register-panel`, confirm password, `login-link` |
| `/stack/` | shared stack boards (`stack-page.css`) |

Login and register both redirect home when `authToken` is already present.

## Session panel

This module is the UX reference the other nine copy. The panel appears once
`GET /api/auth/me` returns a profile, and offers two actions that both end at `/login`:

| Button | Request | Meaning |
|--------|---------|---------|
| `logout-button` (`btn--primary`) | `POST /api/auth/logout` | Ends this session. The JWT is **not** invalidated server-side — logout is stateless by design. |
| `delete-account-button` (`btn--danger`) | `DELETE /api/auth/me` | **Deletes the account.** The user row is gone and the same token now yields 401. |

Delete account asks `window.confirm('Delete this account? This cannot be undone.')` first;
cancel sends no request. `ReferenceAuth.logout()` and `ReferenceAuth.deleteAccount()` are
twins: best-effort call, then the local token goes regardless of the outcome — a token the
server has already rejected must never keep the UI signed in.

## Icons

`icons/pwa-192.png` (from UI runtime overlay) is the apple-touch / install icon —
there is no separate `icon-192.png`.
