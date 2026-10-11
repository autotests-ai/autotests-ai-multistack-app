package drivers.mobile;

import config.ConfigReader;
import config.TestConfig;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriver;

import java.util.HashMap;
import java.util.Map;

/**
 * Selenoid device farm (qaguru/android image). Android only — the web hub
 * for tests/ui is WebBrowserDriver -DremoteUrl=, a different axis.
 */
public class SelenoidMobileDriver extends AppiumDriverBase {

    @Override
    public WebDriver createDriver(Capabilities ignored) {
        TestConfig config = ConfigReader.testConfig;
        String platform = System.getProperty("platform", "android");
        if (!"android".equalsIgnoreCase(platform)) {
            throw new IllegalArgumentException(
                    "Selenoid mobile is Android only (qaguru/android). Got platform: " + platform);
        }
        requireNotCi("selenoid");
        return new AndroidDriver(hubUrl(config.selenoidUrl()), selenoidCaps(config));
    }

    private static MutableCapabilities selenoidCaps(TestConfig config) {
        MutableCapabilities caps = new MutableCapabilities();
        String version = firstNonBlank(config.platformVersion(), "16.0");
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
        caps.setCapability("appium:disableWindowAnimation", true);
        Map<String, Object> selenoid = new HashMap<>();
        selenoid.put("enableVNC", config.enableVnc());
        // attachVideo fetches the recording, so it implies recording is on.
        selenoid.put("enableVideo", config.enableVideo() || config.attachVideo());
        caps.setCapability("selenoid:options", selenoid);
        return caps;
    }
}
