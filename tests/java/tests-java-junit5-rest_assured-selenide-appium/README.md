# tests-java-junit5-rest_assured-selenide-appium

Api + native e2e + web ui (JUnit 5 · Selenide · Rest Assured · Appium). Native
screens drive the apps in `mobile/` via `AppiumBy.accessibilityId` — the same
string as web `data-testid`, which `pages/` uses on `[data-testid]` CSS.

Providers are host-first, picked by the base class:

| Base class | `-DdeviceHost=` → provider | Layer |
|---|---|---|
| `tests/MobileTestBase` | `emulator`/`real`/`simulator` → `LocalMobileDriver` · `selenoid` → `SelenoidMobileDriver` · `browserstack` → `BrowserstackMobileDriver` | `tests/e2e/mobile` |
| `tests/WebTestBase` | `WebBrowserDriver` — local Chrome, or a web hub via `-DremoteUrl=` | `tests/ui/web` |
| `api/ApiTestBase` | no driver — Rest Assured straight on `apiBase` | `tests/api` |

Test packages are **layer × platform**: `tests/api` (platform-agnostic HTTP),
`tests/e2e/mobile`, `tests/ui/web`. `tests/e2e/web` and `tests/ui/mobile` are
reserved empty slots — mobile ui would need a stub stand (`env=mock` is off
here); web e2e would land if real-browser flows grow past forms. Native
objects live in `screens/`, web objects in `pages/` — the same test-id string
as `AppiumBy.accessibilityId` vs `[data-testid]`.

`-Dplatform=` (android|ios) is an axis *inside* each mobile provider — it picks
the driver class and caps. `SelenoidMobileDriver` is Android only
(`qaguru/android`); the web Selenoid hub for `tests/ui/web` is `-DremoteUrl=`.
Shared caps/utils live in `AppiumDriverBase` (abstract parent, not a provider).

Attachments are unified: both bases call the same `allure/Attach` hooks
(`beforeTest` after the session starts — `SelenideAppium.launchApp()` on
mobile, `open()` on web — `afterTest` in `afterEach`) and the class maps
them per host — local mobile records the
screen (`CanRecordScreen` → mp4); farms add a screenshot plus post-session
artifacts (`browserstack`: session link, video, device/appium/network logs
via `api-cloud.browserstack.com/app-automate/sessions/<id>.json`; `selenoid`:
`<hub>/video/<id>.mp4`); web gets a screenshot, on `-DremoteUrl=` with
`-DenableVideo=true` the selenoid video too. Each kind toggles by its own
config flag — `attachLastScreenshot`, `attachPageSource`, `attachDriverLogs`
(`logcat`/`server` on android, `syslog`/`crashlog`/`server` on ios, browser
console on chrome via `goog:loggingPrefs`), `attachVideo` (local recording,
farm video fetch); the failure screenshot comes from AllureSelenide.
Post-session fetching lives in `allure/SessionArtifacts`.

The canonical web pyramid (`/api`, e2e, manual, screenshot) stays in
[`tests-java-junit5-rest_assured-selenide`](../tests-java-junit5-rest_assured-selenide/) —
this cell carries the api slice (`tests/api` over `apiBase`, educational /
integration) plus the web ui slice (`tests/ui/web`), as a selenide+appium
teaching pair.
Contract: [`../../../_contract/native-shell.md`](../../../_contract/native-shell.md).

```bash
cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug
cd tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew emulator

./gradlew real -Dudid=<adb-serial> -DincludeTags=smoke
./gradlew assembleApp emulator -Denv=ci
./gradlew selenoid -Denv=prod
./gradlew browserstack

cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh
xcrun simctl boot "iPhone 16"
cd ../../../tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew test -Dplatform=ios -DdeviceHost=simulator -DincludeTags=smoke
./gradlew test -Dplatform=ios -DdeviceHost=real -Dudid=<udid> \
  -Dios.app=<Debug-iphoneos/multistack-app.app> -DincludeTags=smoke
```

Web ui (`tests/ui/web`, `@Tag("ui")`):

```bash
./gradlew web -Denv=ci        # local Chrome → http://localhost:9821
./gradlew web -Denv=prod      # local Chrome → prod SPA
./gradlew web -Denv=prod -DremoteUrl=https://selenoid.qa.guru/wd/hub \
  -DenableVnc=true -DenableVideo=true
```

Api (`tests/api`, `@Tag("api")`) — Rest Assured on `apiBase`, same env axis as
the apps:

```bash
./gradlew api -Denv=prod      # live prod API
./gradlew api -Denv=ci        # laptop compose http://localhost:8800/api
```

Device host tasks (`emulator`, `real`, `selenoid`, `browserstack`) exclude the
`ui` and `api` tags — `./gradlew api`, `./gradlew web` or `test -DincludeTags=`
are their entry points. Farm tasks run all tests in a shared JUnit pool —
`fixed` strategy, `executor-service=worker_thread_pool` (JUnit 6.1+, caps at
exactly 4 threads; the default `fork_join_pool` spawns extra workers on
blocked joins and blocking calls — work-stealing evens out uneven class
sizes); local hosts stay sequential — one device serves one session at a time.

| Flag | Meaning | Default |
|------|---------|---------|
| `-Denv=` | API (`apiBase`) and web (`baseUrl`) in `config/${env}.properties` | `prod` |
| `-Dplatform=` | android or ios — native only | `android` on `test` + host tasks |
| `-DdeviceHost=` | emulator · real · selenoid · browserstack · simulator — native only | `emulator` on `test` |
| `-DremoteUrl=` | web hub for `tests/ui/web` (empty = local Chrome) | empty |
| `-Dheadless=` | browser headless | `true` on env files |

`-Denv=ci` is laptop compose (`localhost:8800`). Selenoid and BrowserStack
cannot reach it — use `prod` or `stage`. Android bakes the URL at
`./gradlew assembleApp` (`-Penv=`). iOS gets `MULTISTACK_API_BASE` from
`processArguments` (localhost → 127.0.0.1).

Farms (Selenoid + BrowserStack) are in `config/default.properties` with
local Appium. Secrets: `BROWSERSTACK_USERNAME` / `ACCESS_KEY` /
`BROWSERSTACK_APP_ID` (iOS: `BROWSERSTACK_IOS_APP_ID`), or `-Dbrowserstack.user=`.
Selenoid is Android only (`qaguru/android`, `-DplatformVersion=` picks the
image, `16.0` by default).

The shared `selenoid.qa.guru` android pool runs emulator containers whose
system processes (SystemUI / launcher) sometimes show *"isn't responding"*
dialogs — while the app underneath stays alive. That is farm capacity, not
the app or the tests: the same suite is green on a local emulator. Tests
never dismiss system dialogs — the app under test has no reason to know
about a wedged launcher.

iOS simulator: pin `-DdeviceName=` / `-DplatformVersion=` / `-Dudid=`
(defaults iPhone 16 / 18.4) so XCUITest does not spawn a throwaway runtime.

iOS real: USB (this Appium talks usbmux), unlocked, Developer Mode, Trust the
Personal Team. Pass `-Dudid=` and `-Dios.app=` to a **device** `.app`
(iphoneos), not the simulator default.
