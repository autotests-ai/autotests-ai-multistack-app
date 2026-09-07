# tests-java-junit5-rest_assured-selenide-appium

Native e2e (JUnit 5 · Selenide · Rest Assured · Appium) against the apps in
`mobile/`. Locators are `AppiumBy.accessibilityId` — the same string as web
`data-testid`.

Web UI and `/api` stay in
[`tests-java-junit5-rest_assured-selenide`](../tests-java-junit5-rest_assured-selenide/).
Contract: [`../../../_contract/native-shell.md`](../../../_contract/native-shell.md).

`TestBase` picks the provider by `-Dplatform=` (`AndroidDriverProvider` /
`IosDriverProvider`). Host is `-DdeviceHost=` inside that class.

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

| Flag | Meaning | Default |
|------|---------|---------|
| `-Denv=` | API (`apiBase` in `config/${env}.properties`) | `prod` |
| `-Dplatform=` | android or ios | `android` on Gradle host tasks |
| `-DdeviceHost=` | emulator · real · selenoid · browserstack · simulator | `emulator` on `test` |

`-Denv=ci` is laptop compose (`localhost:8800`). Selenoid and BrowserStack
cannot reach it — use `prod` or `stage`. Android bakes the URL at
`./gradlew assembleApp` (`-Penv=`). iOS gets `MULTISTACK_API_BASE` from
`processArguments` (localhost → 127.0.0.1).

Farms (Selenoid + BrowserStack) are in `config/default.properties` with
local Appium. Secrets: `BROWSERSTACK_USERNAME` / `ACCESS_KEY` /
`BROWSERSTACK_APP_ID` (iOS: `BROWSERSTACK_IOS_APP_ID`), or `-Dbrowserstack.user=`.
Selenoid is Android only (`qaguru/android`).

iOS simulator: pin `-DdeviceName=` / `-DplatformVersion=` / `-Dudid=`
(defaults iPhone 16 / 18.4) so XCUITest does not spawn a throwaway runtime.

iOS real: USB (this Appium talks usbmux), unlocked, Developer Mode, Trust the
Personal Team. Pass `-Dudid=` and `-Dios.app=` to a **device** `.app`
(iphoneos), not the simulator default.
