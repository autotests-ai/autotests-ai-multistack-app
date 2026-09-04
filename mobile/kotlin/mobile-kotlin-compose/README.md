# mobile-kotlin-compose

Product UI — Kotlin + Jetpack Compose, **native Android** cell of the same
Multistack product the ten web frontends serve. `mobile-swift-swiftui/` is the
iOS twin: same screens, same testids, same auth API.

Not a WebView wrapper and not a mock: the app talks to a real matrix backend
(`POST /api/auth/login`, `/register`, `/logout`, `GET`/`DELETE /api/auth/me`,
`GET /api/health`) exactly like the React SPA.

```bash
./gradlew :app:assembleDebug                 # app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n dev.multistack.compose/.MainActivity
```

Toolchain: JDK 17+, Android SDK platform 34, Gradle wrapper 8.14.3, AGP 8.13,
Kotlin 2.1.21, Compose BOM 2024.09.03. `local.properties` (`sdk.dir=…`) is
local-only and gitignored.

## Screens

Login, Register, Home — the teaching SPA **minus the note surface**. No items
list, no `GET /api/items`, no note form; `HomePage`'s session and health panels
stay.

| Screen | Composable | Key testids |
|--------|-----------|-------------|
| `/login` | `LoginScreen` | `login-panel`, `login-form-title`, `login-form`, `login-input`, `password-input`, `error-message`, `submit-button`, `register-link` |
| `/register` | `RegisterScreen` | `register-panel`, `register-form-title`, `register-form`, `register-login-input`, `register-password-input`, `confirm-password-input`, `register-error-message`, `register-submit-button`, `login-link` |
| `/` | `HomeScreen` | `multistack-layout`, `welcome-panel`, `welcome-message`, `logout-button`, `delete-account-button`, `health-status` |

Routes are `Screen` states, not URLs: `AppState.navigate` reproduces the SPA
guards — `/login` and `/register` bounce to Home while a token is stored, and a
failing `GET /auth/me` clears the session.

`window.confirm` has no native equivalent, so account deletion opens an
`AlertDialog` with its own ids: `delete-confirm-dialog`,
`delete-confirm-message`, `delete-confirm-button`, `delete-cancel-button`.
Cancel keeps the session (contract acceptance).

## Header — reimplemented, not embedded

The design-system header is markup plus `js/header.js`; a native app cannot load
that JS. `ui/AppHeader.kt` rebuilds the same chrome against the same SSOT
(`design-system/templates/header.html`, `css/header.css`, `js/header.js`):
40dp bar, brand `Multistack`, lang and theme toggles, burger menu.

| Width | Nav | Search | Burger |
|-------|-----|--------|--------|
| ≤768dp | — | — | `header-burger` |
| 769–1023dp | `header-nav` + items | — | — |
| ≥1024dp | `header-nav` + items | `header-search-input` | — |

Inline nav and burger are **exclusive branches of the composition**, so they can
never both exist — the native answer to the CSS specificity trap in rule
`layout-standard` (`.header .header__burger { display: none }`). That 768/769
shell is the whole adaptive story: phone → burger, tablet/landscape → inline nav.

Menu ids follow `js/header.js`: `header-menu`, `header-menu-nav`,
`header-menu-nav-{home,login,register,stack}`, `header-menu-search`,
`header-menu-search-input`, `header-menu-tools`, `header-menu-lang-toggle`,
`header-menu-lang-label`, `header-menu-theme-toggle`. The menu closes on a nav
tap, on Escape (`KEYCODE_ESCAPE`, 111), on system back, and when the viewport
widens past the shell edge.

`header-nav-stack` has no WebView behind it — it opens `/stack/` in the system
browser (`stackIndexUrl`).

Theme defaults to dark, language to `en`, both from `lib/headerConfig.ts`.
Icons are the design-system SVG paths ported through `addPathNodes`
(`ui/Icons.kt`); colours, spacing and radii are copied from `css/tokens.css`
into `ui/Tokens.kt`.

## Testids for Appium

`Modifier.testId(id)` sets **both** `contentDescription` and `testTag`, and the
root turns on `testTagsAsResourceId`. One string therefore answers two locators:

```java
// accessibility id — the same selector works on the SwiftUI cell
driver.findElement(AppiumBy.accessibilityId("login-input")).sendKeys("user1");
// or Android resource-id
driver.findElement(AppiumBy.id("login-input"));
```

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:appPackage": "dev.multistack.compose",
  "appium:appActivity": "dev.multistack.compose.MainActivity",
  "appium:app": "<path>/app-debug.apk"
}
```

Burger e2e stays in `design-system-home/tests` `HeaderBurgerMenuTests` — this
cell implements the menu but does not duplicate those tests, and the Java
pyramid keeps its own scope.

## Backend wiring

| Property | Default | Meaning |
|----------|---------|---------|
| `apiBase` | `https://autotests.ai/stack/backend-java-spring/api` | API origin, already ending at `/api` |
| `backendId` | `backend-java-spring` | scopes the stored token as `authToken:<backendId>`, like `lib/appBase.ts` |
| `stackIndexUrl` | `https://autotests.ai/stack/` | board opened by `header-nav-stack` |

```bash
# emulator against a local backend cell
./gradlew :app:assembleDebug -PapiBase=http://10.0.2.2:8080/api -PbackendId=backend-java-spring
```

Cleartext HTTP is allowed only for `10.0.2.2`, `127.0.0.1`, `localhost` and
`host.docker.internal` (`res/xml/network_security_config.xml`); `autotests.ai`
stays TLS-only.

Seed user `user1` / `password1` → `Welcome, user1!`.
