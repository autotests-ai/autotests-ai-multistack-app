# mobile-swift-swiftui

Product UI — Swift + SwiftUI, **native iOS** cell of the same Multistack
product the ten web frontends serve. `mobile-kotlin-compose/` is the Android
twin: same screens, same testids, same auth API.

Not a WebView wrapper and not a mock: the app talks to a real matrix backend
(`POST /api/auth/login`, `/register`, `/logout`, `GET`/`DELETE /api/auth/me`,
`GET /api/health`) exactly like the React SPA.

```bash
scripts/build-sim.sh                     # prod live pair (GitHub-pair default)
MULTISTACK_ENV=ci scripts/build-sim.sh  # compose :8800 via 127.0.0.1
scripts/build-ipa.sh                     # unsigned device payload (resign to install)
TEAM_ID=ABCDE12345 scripts/build-ipa.sh signed
```

Toolchain: **full Xcode** (Command Line Tools carry no iOS SDK), iOS 17
deployment target, Swift 5 language mode. A human must accept the Xcode license
once (`sudo xcodebuild -license`) before `scripts/build-sim.sh`.
`Multistack.xcodeproj` is committed (synchronized `Sources` group, so new files
need no project edit); [`project.yml`](project.yml) regenerates it with XcodeGen.
The Appium artifact is `multistack-app.app` (bundle `dev.multistack.swiftui`
unchanged). GitHub cannot host a `.app` directory — zip it and upload to tag
`ios`, never `android-debug`.

The sources are UIKit-free, which makes them typecheckable without Xcode:

```bash
swiftc -typecheck -sdk "$(xcrun --show-sdk-path --sdk macosx)" \
  -target arm64-apple-macos14.0 $(find Sources -name '*.swift')
```

## Screens

Login, Register, Home — the teaching SPA **minus the note surface**. No items
list, no `GET /api/items`, no note form; `HomePage`'s session and health panels
stay.

| Screen | View | Key testids |
|--------|------|-------------|
| `/login` | `LoginView` | `login-panel`, `login-form-title`, `login-form`, `login-input`, `password-input`, `error-message`, `submit-button`, `register-link` |
| `/register` | `RegisterView` | `register-panel`, `register-form-title`, `register-form`, `register-login-input`, `register-password-input`, `confirm-password-input`, `register-error-message`, `register-submit-button`, `login-link` |
| `/` | `HomeView` | `multistack-layout`, `welcome-panel`, `welcome-message`, `logout-button`, `delete-account-button`, `health-status` |

Routes are `Screen` states, not URLs: `AppState.navigate(to:)` reproduces the
SPA guards — `/login` and `/register` bounce to Home while a token is stored,
and a failing `GET /auth/me` clears the session.

`window.confirm` has no native equivalent, so account deletion opens an in-app
dialog (not SwiftUI `.alert` — XCUITest does not see those identifiers) with
`delete-confirm-dialog`, `delete-confirm-message`, `delete-confirm-button`,
`delete-cancel-button`. Cancel keeps the session (contract acceptance).

## Header — reimplemented, not embedded

The design-system header is markup plus `js/header.js`; a native app cannot load
that JS. `Sources/Design/AppHeader.swift` rebuilds the same chrome against the
same SSOT (`design-system/templates/header.html`, `css/header.css`,
`js/header.js`): 40pt bar, brand text `QA.GURU`, lang and theme toggles, burger
menu.

| Width | Nav | Search | Burger |
|-------|-----|--------|--------|
| ≤768pt | — | — | `header-burger` |
| 769–1023pt | `header-nav` + items | — | — |
| ≥1024pt | `header-nav` + items | `header-search-input` | — |

Inline nav and burger are **exclusive branches of the view tree**, so they can
never both exist — the native answer to the CSS specificity trap in rule
`layout-standard` (`.header .header__burger { display: none }`). That 768/769
shell is the whole adaptive story: iPhone → burger, iPad/landscape → inline nav.

Menu ids follow `js/header.js`: `header-menu`, `header-menu-nav`,
`header-menu-nav-{home,login,register,stack}`, `header-menu-search`,
`header-menu-search-input`, `header-menu-tools`, `header-menu-lang-toggle`,
`header-menu-lang-label`, `header-menu-theme-toggle`. The menu closes on a nav
tap, on Escape (`.onKeyPress(.escape)` — hardware keyboard / simulator), and
when the viewport widens past the shell edge.

`header-nav-stack` has no WebView behind it — it opens `/stack/` in Safari
(`MultistackStackIndexUrl`).

Theme defaults to dark, language to `en`, both from `lib/headerConfig.ts`.
Colours, spacing and radii are copied from `css/tokens.css` into
`Sources/Design/Tokens.swift`; the design-system glyphs map to their SF Symbol
equivalents (`line.3.horizontal`, `globe`, `moon` / `sun.max`).

## Testids for Appium

`.testId(_:)` sets `accessibilityIdentifier`; wrappers use
`.containerTestId(_:)` so a container id stays addressable without swallowing
its children.

```java
// same accessibility id as the Compose cell
driver.findElement(AppiumBy.accessibilityId("login-input")).sendKeys("user1");
```

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:bundleId": "dev.multistack.swiftui",
  "appium:app": "<path>/multistack-app.app",
  "appium:processArguments": {
    "env": { "MULTISTACK_API_BASE": "https://autotests.ai/stack/backend-java-spring/api" }
  }
}
```

Burger e2e stays in `design-system-home/tests` `HeaderBurgerMenuTests` — this
cell implements the menu but does not duplicate those tests, and the Java
pyramid keeps its own scope.

## Backend wiring

`apiBase` is the same axis as web `-Denv` / `apiBaseUrl`, not Appium
`deviceHost`. Precedence: launch environment (Appium `processArguments.env`) →
`Info.plist` build setting → compiled fallback (prod live pair).

| Env / plist key | Build setting | Default |
|-----------------|---------------|---------|
| `MULTISTACK_API_BASE` / `MultistackApiBase` | `MULTISTACK_API_BASE` | `https://autotests.ai/stack/backend-java-spring/api` |
| `MULTISTACK_BACKEND_ID` / `MultistackBackendId` | `MULTISTACK_BACKEND_ID` | `backend-java-spring` |
| `MULTISTACK_STACK_INDEX_URL` / `MultistackStackIndexUrl` | `MULTISTACK_STACK_INDEX_URL` | `https://autotests.ai/stack/` (board, not the API) |

| `MULTISTACK_ENV=` | Baked / injected `MULTISTACK_API_BASE` |
|-------------------|------------------------------------------|
| `prod` | `https://autotests.ai/stack/backend-java-spring/api` |
| `stage` | `https://stage.autotests.ai/stack/backend-java-spring/api` |
| `ci` | `http://127.0.0.1:8800/api` |

`MULTISTACK_API_BASE=` still wins over `MULTISTACK_ENV=`. Appium
`./gradlew iosSimulator -Denv=ci` injects the ci URL at session start
without a rebuild.

`backendId` scopes the stored token as `authToken:<backendId>` in
`UserDefaults`, mirroring `localStorage` in `lib/appBase.ts`.
`NSAllowsLocalNetworking` covers plain-HTTP local stands; `autotests.ai` stays
TLS-only.

Seed user `user1` / `password1` → `Welcome, user1!`.
