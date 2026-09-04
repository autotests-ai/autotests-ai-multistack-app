# Page objects — Playwright (`getByTestId` / `Locator`) via `pages.App`

**autotests-ai-multistack-app** — home at app root. `baseUrl` in `config/${env}.properties` (Playwright context `baseURL`).

| Page | Class | Open |
|------|-------|------|
| Home | `HomePage` via `app.home` | `navigate("./")` |
| Login | `LoginPage` via `app.login` | `navigate("login")` |
| Register | `RegisterPage` via `app.register` | `navigate("register")` |
| Header | `HeaderPage` via `app.header` | desktop `header-nav-*` · burger `header-menu-nav-*` |

Post-auth state (welcome, logout, delete account) lives on `HomePage` at `/`.

`ci.properties`: `baseUrl=http://localhost:9821` (stand-gateway-ci).
