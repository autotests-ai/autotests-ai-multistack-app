# Native shell contract (Android + iOS)

SSOT for the **`mobile/` zone** — the same Multistack product on a device.
Behaviour and API stay `flows/login.md`; this file only says how the web
testids appear natively, so **one Appium suite drives both platforms**.

| Cell | Path | Artifact | Id |
|------|------|----------|----|
| `mobile-kotlin-compose` | [`../mobile/kotlin/mobile-kotlin-compose/`](../mobile/kotlin/mobile-kotlin-compose/) | `multistack-app.apk` | package `dev.multistack.compose`, activity `.MainActivity` |
| `mobile-swift-swiftui` | [`../mobile/swift/mobile-swift-swiftui/`](../mobile/swift/mobile-swift-swiftui/) | `multistack-app.app` / `.ipa` | bundle `dev.multistack.swiftui` |

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

Native-only ids — `window.confirm` has no native twin, so account deletion is an
in-app dialog instead of a browser one:

`delete-confirm-dialog`, `delete-confirm-message`,
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

Same cell as the web pair — no mock UI, no screenshot stand. The API the
app talks to is **`env`**, the same axis as web `TestConfig.apiBaseUrl`.
Where Appium runs the session is **`deviceHost`**. Do not substitute one
for the other.

Default — and the GitHub Release APK — is the **prod live pair**
`https://autotests.ai/stack/backend-java-spring/api`. That is not CI
(`localhost:8800`) and not the `/stack/` board (`stackIndexUrl`).

| Flag | Meaning | Values |
|------|---------|--------|
| `-Denv=` / Android `-Penv=` / iOS `MULTISTACK_ENV=` | which API (`apiBase`) | `ci` · `stage` · `prod` |
| `-DdeviceHost=` | where the session runs | `emulator` · `real` · `selenoid` · `browserstack` · `simulator` |

| env | Host / AuthSetup (`apiBase`) | Android APK (`-Penv=` → `BuildConfig.API_BASE`) | iOS (`MULTISTACK_API_BASE` / Info.plist) |
|-----|-------------------------------|--------------------------------------------------|------------------------------------------|
| `prod` | `https://autotests.ai/stack/backend-java-spring/api` | same | same |
| `stage` | `https://stage.autotests.ai/stack/backend-java-spring/api` | same | same |
| `ci` | `http://localhost:8800/api` | `http://10.0.2.2:8800/api` | `http://127.0.0.1:8800/api` |

`ci` is laptop compose. Selenoid and BrowserStack cannot reach it — use
`prod` (GitHub APK) or `stage`. `-PapiBase=` / `MULTISTACK_API_BASE=` still
win over the env name.

| Cell | How `apiBase` is set |
|------|----------------------|
| Android | Baked at assemble: `./gradlew :app:assembleDebug -Penv=ci` (or `-PapiBase=… -PbackendId=…`) |
| iOS | `MULTISTACK_ENV=ci scripts/build-sim.sh`, or Appium `processArguments.env`, or the matching `Info.plist` build setting |

Token storage mirrors the SPA key `authToken:<backendId>` —
`SharedPreferences` on Android, `UserDefaults` on iOS.

Seed `user1` / `password1` → `Welcome, user1!`.

## Tests

Living cell: [`../tests/java/tests-java-junit5-rest_assured-selenide-appium/`](../tests/java/tests-java-junit5-rest_assured-selenide-appium/).
One suite, both apps — `AppiumBy.accessibilityId("login-input")`. Web UI and
`/api` stay in `tests-java-junit5-rest_assured-selenide`. Default CI stays that
web cell.

```bash
cd tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew emulator                 # deviceHost=emulator, env=prod (GitHub-pair default)
./gradlew assembleApp emulator -Denv=ci   # bake APK for compose, then AVD
./gradlew selenoid -Denv=prod      # GitHub APK; do not pass -Denv=ci
./gradlew iosSimulator              # processArguments from -Denv (default prod)
```
