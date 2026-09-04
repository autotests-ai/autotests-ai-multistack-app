# Page objects — Selenium 4 (`By` + `WebDriverWait`). Same locators as the Selenide canon.

**autotests-ai-multistack-app** — home at app root. `baseUrl` in `config/${env}.properties`.

| Page | Class | Open |
|------|-------|------|
| Home | `HomePage` | `open("/")` → `GET /` |
| Login | `LoginPage` | `open("/login")` |
| Register | `RegisterPage` | `open("/register")` |
| Header | `HeaderComponent` via `BasePage.header` | desktop `header-nav-*` · burger `header-menu-nav-*` |

Post-auth state (welcome, logout, delete account) lives on `HomePage` at `/`.

`ci.properties`: `baseUrl=http://localhost:9821/` (stand-gateway-ci).
