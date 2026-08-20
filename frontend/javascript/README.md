# JavaScript frontends

All five are active products with their own image and matrix port. Same screens, same
`data-testid` contract, same auth surface — each written in its own stack's idiom, never
sharing app code with a sibling.

| Path | Role | Port |
|------|------|------|
| `frontend-javascript-vanilla/` | Product UI — vanilla JS pages (static, no bundler) | 9800 |
| `frontend-javascript-react/` | Product UI — JS + React (Vite) | 9801 |
| `frontend-javascript-react/src/test/` | Vitest + RTL | — |
| `frontend-javascript-angular/` | Product UI — JS + Angular, JIT + Babel decorators | 9802 |
| `frontend-javascript-angular/src/test/` | Vitest + Angular TestBed | — |
| `frontend-javascript-vue/` | Product UI — JS + Vue 3 (Vite) | 9803 |
| `frontend-javascript-vue/src/test/` | Vitest + Testing Library | — |
| `frontend-javascript-jquery/` | Product UI — JS + jQuery (static, vendored jQuery) | 9804 |
| `frontend-javascript-jquery/src/test/` | Vitest + jsdom | — |

`frontend-javascript-vanilla` is the UX reference the other nine modules copy — start
there when the Session panel, auth flow or error copy changes.

Shared embed lives under `frontend/_shared/`. Lean DS for product images is `vendor/ds` in each module.
