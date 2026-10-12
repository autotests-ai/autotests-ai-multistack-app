# Native shell contract (Android + iOS)

SSOT for the **`mobile/` zone** — the same Multistack product on a device.
Behaviour and API stay `flows/login.md`; this file only says how the web
testids appear natively, so **one Appium suite drives both platforms**.

| Cell | Path | Artifact | Id |
|------|------|----------|----|
| `mobile-kotlin-compose` | [`../mobile/kotlin/mobile-kotlin-compose/`](../mobile/kotlin/mobile-kotlin-compose/) | `app-debug.apk` | package `dev.multistack.compose`, activity `.MainActivity` |
| `mobile-swift-swiftui` | [`../mobile/swift/mobile-swift-swiftui/`](../mobile/swift/mobile-swift-swiftui/) | `multistack-app.app` / `.ipa` | bundle `dev.multistack.swiftui` |

## Locator mapping

| Web | Android | iOS | Appium |
|-----|---------|-----|--------|
| `data-testid="x"` | `contentDescription = "x"` (+ `resource-id` via `testTag` and `testTagsAsResourceId`) | `accessibilityIdentifier = "x"` | `AppiumBy.accessibilityId("x")` |

The string is identical on all three cells. Prefer `accessibility id` — it is
the only strategy that needs no per-platform branch.

## Surface

Screens are the teaching SPA **minus the note surface**: no items list, no
`GET /api/items`, no `note-*` ids.

| Screen | Testids |
|--------|---------|
| Login | `login-panel`, `login-form-title`, `login-form`, `login-input`, `password-input`, `error-message`, `submit-button`, `register-link` |
| Register | `register-panel`, `register-form-title`, `register-form`, `register-login-input`, `register-password-input`, `confirm-password-input`, `register-error-message`, `register-submit-button`, `login-link` |
| Home | `multistack-layout`, `welcome-panel`, `welcome-message`, `logout-button`, `delete-account-button`, `health-status` |
| Header bar | `header`, `header-brand-link`, `header-tools`, `header-lang-toggle`, `header-lang-label`, `header-theme-toggle`, `header-burger`, `header-nav`, `header-nav-{home,login,register,stack}`, `header-search-input` |
| Header menu | `header-menu` plus the bar ids again under that prefix: `-nav`, `-nav-{home,login,register,stack}`, `-search`, `-search-input`, `-tools`, `-lang-toggle`, `-lang-label`, `-theme-toggle` |

Native-only ids — `window.confirm` has no native twin, so account deletion is an
in-app dialog: `delete-confirm-dialog`, `delete-confirm-message`,
`delete-confirm-button`, `delete-cancel-button`. Cancel keeps the session.

## Shell edge

`≤768` burger · `≥769` inline nav · `≥1024` inline search. The two branches are
exclusive in the UI tree, so a suite can assert "burger XOR nav" as a hard
invariant, not a visibility check:

| Viewport | `header-nav` | `header-burger` | `header-search-input` |
|----------|--------------|-----------------|-----------------------|
| phone | absent | present | absent |
| tablet / landscape ≥769 | present | absent | absent below 1024 |

Menu closes on: nav item tap · Escape (`pressKeyCode(111)` on Android, hardware
Escape on iOS) · system back (Android) · widening past the shell edge. Burger
e2e itself lives in `design-system-home/tests` `HeaderBurgerMenuTests`; native
cells implement the menu without duplicating those tests in the Java pyramid.

## Backend

Same cell as the web pair — no mock UI, no screenshot stand. Two axes that are
never substitutes for each other:

| Flag | Meaning | Values |
|------|---------|--------|
| `-Denv=` / Android `-Penv=` / iOS `MULTISTACK_ENV=` | which API (`apiBase`) | `ci` · `stage` · `prod` |
| `-DdeviceHost=` | where the session runs | `emulator` · `real` · `selenoid` · `browserstack` · `simulator` |

| env | `apiBase` — host, tests/api, AuthApiClient and both apps |
|-----|--------------------------------------------|
| `prod` — default, and the GitHub Release APK | `https://autotests.ai/stack/backend-java-spring/api` |
| `stage` | `https://stage.autotests.ai/stack/backend-java-spring/api` |
| `ci` | `http://localhost:8800/api`, reached as `10.0.2.2` from the AVD and `127.0.0.1` from the simulator |

`ci` is laptop compose, so Selenoid and BrowserStack cannot reach it — they need
`prod` or `stage`. `-PapiBase=` / `MULTISTACK_API_BASE=` still win over the env
name. Android bakes the value into `BuildConfig.API_BASE` at assemble time
(`./gradlew :app:assembleDebug -Penv=ci`); iOS takes it from
`MULTISTACK_ENV=ci scripts/build-sim.sh`, Appium `processArguments.env`, or the
matching `Info.plist` build setting.

Token storage mirrors the SPA key `authToken:<backendId>` — `SharedPreferences`
on Android, `UserDefaults` on iOS. Seed `user1` / `password1` → `Welcome, user1!`.

## Tests

Living cell: [`../tests/java/tests-java-junit5-rest_assured-selenide-appium/`](../tests/java/tests-java-junit5-rest_assured-selenide-appium/).
One suite, both apps — `AppiumBy.accessibilityId("login-input")` in
`tests/e2e/mobile` (`screens/`). The cell also carries a web `tests/ui/web`
slice (`pages/`, `WebBrowserDriver`) and an api slice (`tests/api` + `api/`, Rest
Assured on the same `apiBase`) so one module covers api+e2e+ui; the
canonical web pyramid (`/api`, e2e, manual, screenshot) still lives in
`tests-java-junit5-rest_assured-selenide`, which is also default CI.

```bash
cd tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew api -Denv=prod                  # api slice over HTTP (apiBase)
./gradlew emulator                        # deviceHost=emulator, env=prod
./gradlew assembleApp emulator -Denv=ci   # bake APK for compose, then AVD
./gradlew real -DincludeTags=smoke        # USB phone in adb, not an emulator
./gradlew selenoid -Denv=prod             # GitHub APK; do not pass -Denv=ci
./gradlew test -Dplatform=ios -DdeviceHost=simulator -DincludeTags=smoke
./gradlew test -Dplatform=ios -DdeviceHost=real -Dudid=<udid> \
  -Dios.app=<Debug-iphoneos/multistack-app.app> -DincludeTags=smoke
```

Attachments via `allure/Attach` — local hosts record the device screen
(`CanRecordScreen` → mp4); BrowserStack: video mp4, device/appium/network
logs, session link polled from `api-cloud.browserstack.com/app-automate/
sessions/<id>.json` (`bstack:options` `debug`/`appiumLogs`/`networkLogs`/
`video`); Selenoid: `<hub>/video/<id>.mp4` with creds taken from
`selenoidUrl`. Each attach kind toggles by its own flag —
`attachLastScreenshot`, `attachPageSource`, `attachDriverLogs`
(logcat / syslog / server), `attachVideo`. Live kinds attach inside
`@AfterEach` while the driver is still alive; farm session artifacts are
fetched post-session (after `closeWebDriver`) by `allure/SessionArtifacts`.

Host tasks are Android shorthands. **iOS has no task** — platform and host are
flags on `test`: `-Dplatform=ios` with `-DdeviceHost=simulator|real|browserstack`.
`processArguments` still come from `-Denv` (default `prod`).
iOS real needs USB and a device `.app` (`-Dios.app=`), not the simulator build.

### Pinning the simulator

Set `appium:deviceName` and `appium:platformVersion` in `LocalMobileDriver`
(defaults: iPhone 16 / 18.4). Without them XCUITest creates a throwaway
simulator on the newest runtime Xcode carries — today iOS 26, which has no
`iPhone 16` and whose SwiftUI `TextField` is not a `UITextField`, so typed
text never lands.

Override with `-DdeviceName=` / `-DplatformVersion=` / `-Dudid=`. A booted
simulator is a precondition, the same as a running AVD for `emulator`.

