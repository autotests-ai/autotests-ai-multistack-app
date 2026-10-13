package drivers.mobile;

import config.TestConfig;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.MutableCapabilities;

import java.util.HashMap;
import java.util.Map;

/**
 * BrowserStack device farm, android and ios. Secrets come from
 * BROWSERSTACK_USERNAME / ACCESS_KEY / *_APP_ID env or -Dbrowserstack.*=
 * Session artifacts (video, device/appium logs) attach in tests via
 * allure/SessionArtifacts.browserstackArtifacts — appiumLogs/networkLogs caps below
 * are what makes those URLs exist.
 */
public final class BrowserstackMobileDriver extends AppiumDriverBase {

    public static AppiumDriver create(TestConfig config) {
        String platform = System.getProperty("platform", "android");
        requireNotCi("browserstack");
        java.net.URL hub = hubUrl(config.browserstackUrl());
        return switch (platform.toLowerCase()) {
            case "android" -> new AndroidDriver(hub, androidBrowserstackCaps(config));
            case "ios" -> new IOSDriver(hub, iosBrowserstackCaps(config));
            default -> throw new IllegalArgumentException(
                    "platform: android or ios. Got: " + platform);
        };
    }

    private static MutableCapabilities androidBrowserstackCaps(TestConfig config) {
        MutableCapabilities caps = androidCaps();
        caps.setCapability("appium:app", required("browserstack.app", config.browserstackApp()));
        caps.setCapability("appium:deviceName", config.browserstackDevice());
        caps.setCapability("appium:platformVersion", config.browserstackOsVersion());
        caps.setCapability("bstack:options", browserstackOptions("android", config));
        return caps;
    }

    private static MutableCapabilities iosBrowserstackCaps(TestConfig config) {
        MutableCapabilities caps = iosCaps(config);
        caps.setCapability("appium:app", required("browserstack.ios.app", config.browserstackIosApp()));
        caps.setCapability("appium:deviceName", config.browserstackIosDevice());
        caps.setCapability("appium:platformVersion", config.browserstackIosOsVersion());
        caps.setCapability("bstack:options", browserstackOptions("ios", config));
        return caps;
    }

    private static Map<String, Object> browserstackOptions(String sessionName, TestConfig config) {
        Map<String, Object> bstack = new HashMap<>();
        bstack.put("userName", required("browserstack.user", config.browserstackUser()));
        bstack.put("accessKey", required("browserstack.key", config.browserstackKey()));
        bstack.put("projectName", "Multistack native");
        bstack.put("buildName", "native-e2e");
        bstack.put("sessionName", sessionName);
        bstack.put("debug", true);          // device logs
        bstack.put("appiumLogs", true);     // appium server logs
        bstack.put("networkLogs", true);    // device network traffic
        bstack.put("video", true);          // session video_url
        return bstack;
    }

    private static String required(String key, String value) {
        if (value == null || value.isBlank() || value.startsWith("${")) {
            throw new IllegalStateException(
                    "Set " + key + " in config/default.properties or -D" + key + "=");
        }
        return value;
    }
}
