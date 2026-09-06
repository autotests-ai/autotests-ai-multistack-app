package drivers;

import com.codeborne.selenide.WebDriverProvider;
import config.TestConfig;
import io.appium.java_client.ios.IOSDriver;
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

public class IosDriverProvider implements WebDriverProvider {

    private static final Path DEFAULT_APP = Path.of(
            "..", "..", "..",
            "mobile", "swift", "mobile-swift-swiftui",
            "build", "Build", "Products", "Debug-iphonesimulator", "multistack-app.app");

    @Override
    public WebDriver createDriver(Capabilities ignored) {
        TestConfig config = ConfigFactory.create(
                TestConfig.class, System.getProperties(), System.getenv());
        String host = System.getProperty("deviceHost", "simulator");
        MutableCapabilities caps;
        String hub;
        switch (host) {
            case "simulator" -> {
                caps = localCaps(config, false);
                hub = config.appiumUrl();
            }
            case "real" -> {
                caps = localCaps(config, true);
                hub = config.appiumUrl();
            }
            case "browserstack" -> {
                if ("ci".equals(System.getProperty("env", "prod"))) {
                    throw new IllegalStateException(
                            "-Denv=ci is laptop compose. browserstack cannot reach it. Use -Denv=prod.");
                }
                caps = browserstackCaps(config);
                hub = config.browserstackUrl();
            }
            default -> throw new IllegalArgumentException(
                    "iOS deviceHost: simulator, real, browserstack. Got: " + host);
        }
        return new IOSDriver(hubUrl(hub), caps);
    }

    private static MutableCapabilities localCaps(TestConfig config, boolean realDevice) {
        MutableCapabilities caps = iosCaps(config);
        caps.setCapability("appium:app", localApp(config));
        if (realDevice) {
            String udid = config.udid();
            if (udid == null || udid.isBlank()) {
                throw new IllegalStateException("Set -Dudid= to the iPhone (Xcode / window → devices)");
            }
            caps.setCapability("appium:udid", udid);
            return caps;
        }
        caps.setCapability("appium:deviceName", firstNonBlank(config.deviceName(), "iPhone 16"));
        caps.setCapability("appium:platformVersion", firstNonBlank(config.platformVersion(), "18.4"));
        String udid = config.udid();
        if (udid != null && !udid.isBlank()) {
            caps.setCapability("appium:udid", udid);
        }
        return caps;
    }

    private static MutableCapabilities browserstackCaps(TestConfig config) {
        MutableCapabilities caps = iosCaps(config);
        caps.setCapability("appium:app", required("browserstack.ios.app", config.browserstackIosApp()));
        caps.setCapability("appium:deviceName", config.browserstackIosDevice());
        caps.setCapability("appium:platformVersion", config.browserstackIosOsVersion());
        Map<String, Object> bstack = new HashMap<>();
        bstack.put("userName", required("browserstack.user", config.browserstackUser()));
        bstack.put("accessKey", required("browserstack.key", config.browserstackKey()));
        bstack.put("projectName", "Multistack native");
        bstack.put("buildName", "native-e2e");
        bstack.put("sessionName", "ios");
        bstack.put("debug", true);
        caps.setCapability("bstack:options", bstack);
        return caps;
    }

    private static MutableCapabilities iosCaps(TestConfig config) {
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
        Map<String, Object> processArguments = new HashMap<>();
        Map<String, String> env = new HashMap<>();
        env.put("MULTISTACK_API_BASE", deviceApiBase(config.apiBase()));
        env.put("MULTISTACK_BACKEND_ID", config.backendId());
        processArguments.put("env", env);
        caps.setCapability("appium:processArguments", processArguments);
        return caps;
    }

    private static String localApp(TestConfig config) {
        String configured = config.iosApp();
        Path path;
        if (configured == null || configured.isBlank()) {
            path = Path.of(System.getProperty("user.dir")).resolve(DEFAULT_APP);
        } else {
            path = Path.of(configured);
            if (!path.isAbsolute()) {
                path = Path.of(System.getProperty("user.dir")).resolve(path);
            }
        }
        path = path.toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IllegalStateException(
                    "App not found at " + path
                            + ". Build: cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh");
        }
        return path.toString();
    }

    private static String deviceApiBase(String apiBase) {
        if (apiBase == null || apiBase.isBlank()) {
            throw new IllegalStateException("Set apiBase in config/${env}.properties");
        }
        String value = apiBase.endsWith("/") ? apiBase.substring(0, apiBase.length() - 1) : apiBase;
        return value.replace("://localhost", "://127.0.0.1");
    }

    private static String required(String key, String value) {
        if (value == null || value.isBlank() || value.startsWith("${")) {
            throw new IllegalStateException(
                    "Set " + key + " in config/default.properties or -D" + key + "=");
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
