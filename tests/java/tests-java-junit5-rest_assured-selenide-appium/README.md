# tests-java-junit5-rest_assured-selenide-appium

Native **e2e** of the default Java school (JUnit 5 · Selenide · Rest Assured lineage)
against the Multistack apps in `mobile/`. One suite, both platforms: Appium
`accessibility id` is the same string as web `data-testid`.

Web UI and the `/api` catalog stay in
[`tests-java-junit5-rest_assured-selenide`](../tests-java-junit5-rest_assured-selenide/).
Burger e2e stays in `design-system-home/tests` `HeaderBurgerMenuTests`.
Default CI stays the web Selenide cell.

Contract: [`../../../_contract/native-shell.md`](../../../_contract/native-shell.md).

```bash
# Android emulator (Appium at http://127.0.0.1:4723/wd/hub)
cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug
cd tests/java/tests-java-junit5-rest_assured-selenide-appium
./gradlew emulator

# iOS simulator (full Xcode, license accepted)
cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh
./gradlew iosSimulator
```

| Host | Task | Needs |
|------|------|--------|
| emulator | `./gradlew emulator` | Appium 2 · AVD · `app-debug.apk` |
| real | `./gradlew real` | USB debugging · APK |
| selenoid | `./gradlew selenoid` | `ANDROID_APP_URL` (HTTP APK, not a file path) |
| browserstack | `./gradlew browserstack` | `BROWSERSTACK_USERNAME` / `ACCESS_KEY` / `BROWSERSTACK_APP_ID` |
| simulator | `./gradlew iosSimulator` | Xcode · `Multistack.app` |
| ios real | `./gradlew iosReal` | signing · `IOS_UDID` |

Overrides: `-DdeviceHost=` · `-Dplatform=` · `APPIUM_URL` · `ANDROID_APP` · `IOS_APP` · `ANDROID_UDID` · `IOS_UDID`.

Seed `user1` / `password1` → `Welcome, user1!` against
`https://autotests.ai/stack/backend-java-spring/api`.

No BrowserStack SDK (`browserstack.yml` / javaagent). Caps and hub URL are explicit W3C.
