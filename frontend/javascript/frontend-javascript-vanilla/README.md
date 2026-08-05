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
| `index.html` | `reference-layout`, health/items/welcome panels |
| `login.html` | `login-panel`, form controls, `register-link` |
| `register.html` | `register-panel`, confirm password, `login-link` |
| `/stack/` | shared stack boards (`stack-page.css`) |

Login and register both redirect home when `authToken` is already present.

## Icons

`icons/pwa-192.png` (from UI runtime overlay) is the apple-touch / install icon —
there is no separate `icon-192.png`.
