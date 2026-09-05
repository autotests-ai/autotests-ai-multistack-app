package config;

import org.openqa.selenium.MutableCapabilities;

import java.util.HashMap;
import java.util.Map;

public final class MobileCapabilities {

    private MobileCapabilities() {
    }

    public static MutableCapabilities multistack(String sessionName) {
        if (AppPlatform.current() == AppPlatform.IOS) {
            return ios(sessionName);
        }
        return android(sessionName);
    }

    private static MutableCapabilities android(String sessionName) {
        return switch (DeviceHost.current()) {
            case BROWSERSTACK -> androidBrowserstack(sessionName);
            case SELENOID -> androidSelenoid();
            case EMULATOR, REAL -> androidLocal();
            case SIMULATOR -> throw new IllegalStateException("Android does not use simulator host");
        };
    }

    private static MutableCapabilities ios(String sessionName) {
        return switch (DeviceHost.current()) {
            case BROWSERSTACK -> iosBrowserstack(sessionName);
            case SIMULATOR, REAL -> iosLocal();
            case EMULATOR, SELENOID -> throw new IllegalStateException("Invalid iOS host");
        };
    }

    private static MutableCapabilities baseAndroid() {
        MutableCapabilities caps = new MutableCapabilities();
        caps.setCapability("platformName", "Android");
        caps.setCapability("appium:automationName", "UiAutomator2");
        caps.setCapability("appium:appPackage", "dev.multistack.compose");
        caps.setCapability("appium:appActivity", "dev.multistack.compose.MainActivity");
        caps.setCapability("appium:appWaitActivity", "dev.multistack.compose.MainActivity");
        caps.setCapability("appium:autoGrantPermissions", true);
        caps.setCapability("appium:noReset", false);
        caps.setCapability("appium:newCommandTimeout", 120);
        return caps;
    }

    private static MutableCapabilities baseIos() {
        MutableCapabilities caps = new MutableCapabilities();
        caps.setCapability("platformName", "iOS");
        caps.setCapability("appium:automationName", "XCUITest");
        caps.setCapability("appium:bundleId", MobileConfig.iosBundleId());
        caps.setCapability("appium:autoAcceptAlerts", false);
        caps.setCapability("appium:noReset", false);
        caps.setCapability("appium:newCommandTimeout", 120);
        caps.setCapability("appium:wdaLaunchTimeout", 120_000);
        Map<String, Object> processArguments = new HashMap<>();
        Map<String, String> env = new HashMap<>();
        env.put("MULTISTACK_API_BASE", MobileConfig.optional(
                "API_BASE", "https://autotests.ai/stack/backend-java-spring/api"));
        env.put("MULTISTACK_BACKEND_ID", MobileConfig.optional(
                "BACKEND_ID", "backend-java-spring"));
        processArguments.put("env", env);
        caps.setCapability("appium:processArguments", processArguments);
        String org = MobileConfig.xcodeOrgId();
        if (org != null && !org.isBlank()) {
            caps.setCapability("appium:xcodeOrgId", org);
            caps.setCapability("appium:xcodeSigningId", MobileConfig.xcodeSigningId());
        }
        return caps;
    }

    private static MutableCapabilities androidLocal() {
        MutableCapabilities caps = baseAndroid();
        caps.setCapability("appium:app", MobileConfig.localAndroidApp());
        caps.setCapability("appium:udid", Adb.udid(DeviceHost.current()));
        return caps;
    }

    private static MutableCapabilities androidSelenoid() {
        // Selenoid picks the android image by browserName + browserVersion.
        // The Appium 1.x inside qaguru/android rejects appPackage together with
        // browserName, so the APK's launcher activity is the wait target.
        MutableCapabilities caps = new MutableCapabilities();
        String version = MobileConfig.androidVersion();
        caps.setCapability("platformName", "Android");
        caps.setCapability("browserName", "android");
        caps.setCapability("browserVersion", version);
        caps.setCapability("appium:automationName", "UiAutomator2");
        caps.setCapability("appium:deviceName", "android");
        caps.setCapability("appium:app", MobileConfig.androidAppUrl());
        caps.setCapability("appium:appWaitActivity", "*");
        caps.setCapability("appium:autoGrantPermissions", true);
        caps.setCapability("appium:noReset", false);
        caps.setCapability("appium:newCommandTimeout", 120);
        Map<String, Object> selenoid = new HashMap<>();
        selenoid.put("enableVNC", true);
        selenoid.put("enableVideo", true);
        caps.setCapability("selenoid:options", selenoid);
        return caps;
    }

    private static MutableCapabilities androidBrowserstack(String sessionName) {
        MutableCapabilities caps = baseAndroid();
        caps.setCapability("appium:app", MobileConfig.browserstackApp());
        caps.setCapability("appium:deviceName", MobileConfig.browserstackDevice());
        caps.setCapability("appium:platformVersion", MobileConfig.browserstackOsVersion());
        caps.setCapability("bstack:options", bstackOptions(sessionName));
        return caps;
    }

    private static MutableCapabilities iosLocal() {
        MutableCapabilities caps = baseIos();
        caps.setCapability("appium:app", MobileConfig.localIosApp());
        String udid = MobileConfig.iosUdid();
        if (udid != null && !udid.isBlank()) {
            caps.setCapability("appium:udid", udid);
        }
        if (DeviceHost.current() == DeviceHost.SIMULATOR) {
            caps.setCapability("appium:deviceName",
                    MobileConfig.optional("IOS_DEVICE_NAME", "iPhone 16"));
        } else if (udid == null || udid.isBlank()) {
            throw new IllegalStateException("Set IOS_UDID for a real iPhone");
        }
        return caps;
    }

    private static MutableCapabilities iosBrowserstack(String sessionName) {
        MutableCapabilities caps = baseIos();
        caps.setCapability("appium:app", MobileConfig.browserstackIosApp());
        caps.setCapability("appium:deviceName", MobileConfig.browserstackIosDevice());
        caps.setCapability("appium:platformVersion", MobileConfig.browserstackIosOsVersion());
        caps.setCapability("bstack:options", bstackOptions(sessionName));
        return caps;
    }

    private static Map<String, Object> bstackOptions(String sessionName) {
        Map<String, Object> options = new HashMap<>();
        options.put("userName", MobileConfig.browserstackUsername());
        options.put("accessKey", MobileConfig.browserstackAccessKey());
        options.put("projectName", MobileConfig.project());
        options.put("buildName", MobileConfig.build());
        options.put("sessionName", sessionName);
        options.put("debug", true);
        return options;
    }
}
