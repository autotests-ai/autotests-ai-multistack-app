package drivers;

import com.codeborne.selenide.WebDriverProvider;
import config.BrowserstackConfig;
import config.TestConfig;
import io.appium.java_client.android.AndroidDriver;
import org.aeonbits.owner.ConfigFactory;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriver;

import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class AndroidDriverProvider implements WebDriverProvider {

    private static final Path DEFAULT_APK = Path.of(
            "..", "..", "..",
            "mobile", "kotlin", "mobile-kotlin-compose",
            "app", "build", "outputs", "apk", "debug", "multistack-app.apk");

    @Override
    public WebDriver createDriver(Capabilities ignored) {
        TestConfig config = ConfigFactory.create(TestConfig.class, System.getProperties());
        String host = System.getProperty("deviceHost", "emulator");
        MutableCapabilities caps;
        String hub;
        switch (host) {
            case "emulator" -> {
                caps = localCaps(config, false);
                hub = config.appiumUrl();
            }
            case "real" -> {
                caps = localCaps(config, true);
                hub = config.appiumUrl();
            }
            case "selenoid" -> {
                requireNotCi(host);
                caps = selenoidCaps(config);
                hub = config.selenoidUrl();
            }
            case "browserstack" -> {
                requireNotCi(host);
                caps = browserstackCaps();
                hub = "https://hub.browserstack.com/wd/hub";
            }
            default -> throw new IllegalArgumentException(
                    "Android deviceHost: emulator, real, selenoid, browserstack. Got: " + host);
        }
        return new AndroidDriver(hubUrl(hub), caps);
    }

    private static MutableCapabilities localCaps(TestConfig config, boolean realDevice) {
        MutableCapabilities caps = androidCaps();
        caps.setCapability("appium:app", localApk(config));
        caps.setCapability("appium:ignoreHiddenApiPolicyError", true);
        String udid = config.udid();
        if (realDevice && (udid == null || udid.isBlank())) {
            throw new IllegalStateException("Set -Dudid= to the USB device (adb devices)");
        }
        if (udid != null && !udid.isBlank()) {
            caps.setCapability("appium:udid", udid);
        }
        return caps;
    }

    private static MutableCapabilities selenoidCaps(TestConfig config) {
        MutableCapabilities caps = new MutableCapabilities();
        String version = firstNonBlank(config.platformVersion(), "13.0");
        caps.setCapability("platformName", "Android");
        caps.setCapability("browserName", "android");
        caps.setCapability("browserVersion", version);
        caps.setCapability("appium:automationName", "UiAutomator2");
        caps.setCapability("appium:deviceName", "android");
        caps.setCapability("appium:app", config.androidAppUrl());
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

    private static MutableCapabilities browserstackCaps() {
        BrowserstackConfig bs = ConfigFactory.create(BrowserstackConfig.class, System.getProperties());
        MutableCapabilities caps = androidCaps();
        caps.setCapability("appium:app", required("browserstack.app", bs.app()));
        caps.setCapability("appium:deviceName", bs.device());
        caps.setCapability("appium:platformVersion", bs.osVersion());
        Map<String, Object> bstack = new HashMap<>();
        bstack.put("userName", required("browserstack.user", bs.user()));
        bstack.put("accessKey", required("browserstack.key", bs.key()));
        bstack.put("projectName", "Multistack native");
        bstack.put("buildName", "native-e2e");
        bstack.put("sessionName", "android");
        bstack.put("debug", true);
        caps.setCapability("bstack:options", bstack);
        return caps;
    }

    private static MutableCapabilities androidCaps() {
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

    private static String localApk(TestConfig config) {
        String configured = config.androidApp();
        Path path;
        if (configured == null || configured.isBlank()) {
            path = Path.of(System.getProperty("user.dir")).resolve(DEFAULT_APK);
        } else {
            path = Path.of(configured);
            if (!path.isAbsolute()) {
                path = Path.of(System.getProperty("user.dir")).resolve(path);
            }
        }
        path = path.toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IllegalStateException(
                    "APK not found at " + path
                            + ". Build: cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug");
        }
        return path.toString();
    }

    private static void requireNotCi(String host) {
        if ("ci".equals(System.getProperty("env", "prod"))) {
            throw new IllegalStateException(
                    "-Denv=ci is laptop compose. " + host + " cannot reach it. Use -Denv=prod.");
        }
    }

    private static String required(String key, String value) {
        if (value == null || value.isBlank() || value.startsWith("${")) {
            throw new IllegalStateException(
                    "Set " + key + " in browserstack.properties or -D" + key + "=");
        }
        return value;
    }

    private static String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static java.net.URL hubUrl(String spec) {
        try {
            return URI.create(spec).toURL();
        } catch (IllegalArgumentException | MalformedURLException e) {
            throw new IllegalStateException("Invalid hub URL: " + spec, e);
        }
    }
}
