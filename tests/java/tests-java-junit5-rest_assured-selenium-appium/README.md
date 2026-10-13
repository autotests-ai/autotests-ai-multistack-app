# tests-java-junit5-rest_assured-selenium-appium

Api + native e2e (JUnit 5 · Selenium · Rest Assured · Appium java-client), no
Selenide. The same 21 native scenarios, hosts, config and Allure artifacts as
[`tests-java-junit5-rest_assured-selenide-appium`](../tests-java-junit5-rest_assured-selenide-appium/);
screens are page objects in the style of
[`tests-java-junit5-rest_assured-selenium`](../tests-java-junit5-rest_assured-selenium/)
with explicit `WebDriverWait` over `AppiumBy.accessibilityId` (no implicit
waits, no sleeps). The web ui slice stays in the Selenium/Selenide web cells.

| Piece | Where |
|---|---|
| Session per test thread | `drivers/mobile/MobileDriver` (`ThreadLocal`) → `Local`/`Selenoid`/`BrowserstackMobileDriver` by `-DdeviceHost=` |
| Explicit waits | `screens/BaseScreen` (`visible`, `click`, `type`, `shouldHaveText`) |
| Allure | `allure/Attach` (flags `attachLastScreenshot`, `attachPageSource`, `attachDriverLogs`, `attachVideo`) + `Attach.ScreenshotOnFailure`; post-session `allure/SessionArtifacts` (Selenoid mp4, BrowserStack session/video/logs) |
| Api | `api/AuthApiClient`, `tests/api` (Rest Assured on `apiBase`) |

```bash
cd tests/java/tests-java-junit5-rest_assured-selenium-appium
./gradlew selenoid -Denv=prod          # Selenoid farm, pool 3
./gradlew emulator                     # local Appium, sequential
./gradlew real -Dudid=<adb-serial> -DincludeTags=smoke
./gradlew browserstack                 # pool 4, BROWSERSTACK_* env
./gradlew test -Dplatform=ios -DdeviceHost=simulator -DincludeTags=smoke
./gradlew api -Denv=prod
```

Flags, env axis, farm limits (Selenoid **3** sessions — the farm host's CPU
ceiling) and the release-APK rule are identical to the Selenide cell — see its
README. JUnit is `6.1.3` for `worker_thread_pool`; Selenium `4.50.0` is the
floor of java-client `11.0.0`.
