package drivers.mobile;

import config.TestConfig;
import org.openqa.selenium.MutableCapabilities;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/** Shared Appium capabilities for the *MobileDriver factories. */
abstract class AppiumDriverBase {

    static MutableCapabilities androidCaps() {
        MutableCapabilities caps = new MutableCapabilities();
        caps.setCapability("platformName", "Android");
        caps.setCapability("appium:automationName", "UiAutomator2");
        caps.setCapability("appium:appPackage", "dev.multistack.compose");
        caps.setCapability("appium:appActivity", "dev.multistack.compose.MainActivity");
        caps.setCapability("appium:appWaitActivity", "dev.multistack.compose.MainActivity");
        caps.setCapability("appium:autoGrantPermissions", true);
        caps.setCapability("appium:noReset", false);
        caps.setCapability("appium:newCommandTimeout", 120);
        // Window transitions only cost the emulator SystemUI frames; tests
        // assert on semantics (testIds), not on animations.
        caps.setCapability("appium:disableWindowAnimation", true);
        return caps;
    }

    static MutableCapabilities iosCaps(TestConfig config) {
        MutableCapabilities caps = new MutableCapabilities();
        caps.setCapability("platformName", "iOS");
        caps.setCapability("appium:automationName", "XCUITest");
        caps.setCapability("appium:bundleId", "dev.multistack.swiftui");
        caps.setCapability("appium:autoAcceptAlerts", false);
        caps.setCapability("appium:noReset", false);
        caps.setCapability("appium:newCommandTimeout", 120);
        caps.setCapability("appium:wdaLaunchTimeout", 120_000);
        caps.setCapability("appium:keyboardAutocorrection", false);
        caps.setCapability("appium:keyboardPrediction", false);
        caps.setCapability("appium:sendKeyStrategy", "setValue");
        Map<String, Object> processArguments = new HashMap<>();
        Map<String, String> env = new HashMap<>();
        env.put("MULTISTACK_API_BASE", deviceApiBase(config.apiBase()));
        env.put("MULTISTACK_BACKEND_ID", config.backendId());
        processArguments.put("env", env);
        caps.setCapability("appium:processArguments", processArguments);
        return caps;
    }

    /** Devices see laptop compose on 10.0.2.2 (AVD) / 127.0.0.1 (simulator), not localhost. */
    private static String deviceApiBase(String apiBase) {
        if (apiBase == null || apiBase.isBlank()) {
            throw new IllegalStateException("Set apiBase in config/${env}.properties");
        }
        String value = apiBase.endsWith("/") ? apiBase.substring(0, apiBase.length() - 1) : apiBase;
        return value.replace("://localhost", "://127.0.0.1");
    }

    static void requireNotCi(String host) {
        if ("ci".equals(System.getProperty("env", "prod"))) {
            throw new IllegalStateException(
                    "-Denv=ci is laptop compose. " + host + " cannot reach it. Use -Denv=prod.");
        }
    }

    static String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    static java.net.URL hubUrl(String spec) {
        try {
            return URI.create(spec).toURL();
        } catch (IllegalArgumentException | MalformedURLException e) {
            throw new IllegalStateException("Invalid hub URL: " + spec, e);
        }
    }
}
