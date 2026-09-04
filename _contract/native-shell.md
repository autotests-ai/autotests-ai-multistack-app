# Native shell contract (Android + iOS)

SSOT for the **native** frontend cells of the Multistack slot. Behaviour and API
stay `flows/login.md`; this file only says how the web testids appear on a
device, so **one Appium suite drives both platforms**.

| Cell | Path | Artifact | Id |
|------|------|----------|----|
| `frontend-kotlin-compose` | [`../frontend/kotlin/frontend-kotlin-compose/`](../frontend/kotlin/frontend-kotlin-compose/) | `app-debug.apk` | package `dev.multistack.compose`, activity `.MainActivity` |
| `frontend-swift-swiftui` | [`../frontend/swift/frontend-swift-swiftui/`](../frontend/swift/frontend-swift-swiftui/) | `Multistack.app` / `.ipa` | bundle `dev.multistack.swiftui` |

## Locator mapping

| Web | Android | iOS | Appium |
|-----|---------|-----|--------|
| `data-testid="x"` | `contentDescription = "x"` (+ `resource-id` via `testTag` and `testTagsAsResourceId`) | `accessibilityIdentifier = "x"` | `AppiumBy.accessibilityId("x")` |

The string is identical on all three cells. Prefer `accessibility id` — it is
the only strategy that needs no per-platform branch.

## Surface

Screens are the teaching SPA **minus the note surface**: no items list, no
`GET /api/items`, no `note-form` / `note-title-input`.

| Screen | Testids |
|--------|---------|
| Login | `login-panel`, `login-form-title`, `login-form`, `login-input`, `password-input`, `error-message`, `submit-button`, `register-link` |
| Register | `register-panel`, `register-form-title`, `register-form`, `register-login-input`, `register-password-input`, `confirm-password-input`, `register-error-message`, `register-submit-button`, `login-link` |
| Home | `multistack-layout`, `welcome-panel`, `welcome-message`, `logout-button`, `delete-account-button`, `health-status` |
| Header bar | `header`, `header-brand-link`, `header-tools`, `header-lang-toggle`, `header-lang-label`, `header-theme-toggle`, `header-burger`, `header-nav`, `header-nav-{home,login,register,stack}`, `header-search-input` |
| Header menu | `header-menu`, `header-menu-nav`, `header-menu-nav-{home,login,register,stack}`, `header-menu-search`, `header-menu-search-input`, `header-menu-tools`, `header-menu-lang-toggle`, `header-menu-lang-label`, `header-menu-theme-toggle` |

Native-only ids — `window.confirm` has no native twin, so account deletion is a
platform dialog instead of a browser one:

`delete-confirm-dialog` (Android), `delete-confirm-message`,
`delete-confirm-button`, `delete-cancel-button`. Cancel keeps the session.

## Shell edge

`≤768` burger · `≥769` inline nav · `≥1024` inline search. On both platforms the
two branches are exclusive in the UI tree, so a suite can assert
"burger XOR nav" as a hard invariant, not a visibility check:

| Viewport | `header-nav` | `header-burger` | `header-search-input` |
|----------|--------------|-----------------|-----------------------|
| phone | absent | present | absent |
| tablet / landscape ≥769 | present | absent | absent below 1024 |

Menu closes on: nav item tap · Escape (`pressKeyCode(111)` on Android,
hardware Escape on iOS) · system back (Android) · widening past the shell edge.

Burger e2e itself lives in `design-system-home/tests` `HeaderBurgerMenuTests`;
native cells implement the menu without duplicating those tests in the Java
pyramid.

## Backend

Same cell as the web pair — no mock UI. Default API base
`https://autotests.ai/stack/backend-java-spring/api`; seed `user1` /
`password1` → `Welcome, user1!`.

| Cell | Override |
|------|----------|
| Android | `./gradlew :app:assembleDebug -PapiBase=… -PbackendId=…` |
| iOS | `MULTISTACK_API_BASE` env (Appium `processArguments.env`) or the matching `Info.plist` build setting |

Token storage mirrors the SPA key `authToken:<backendId>` —
`SharedPreferences` on Android, `UserDefaults` on iOS.
