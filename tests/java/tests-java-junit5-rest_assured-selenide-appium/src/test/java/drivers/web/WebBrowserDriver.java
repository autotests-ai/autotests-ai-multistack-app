package drivers.web;

import com.codeborne.selenide.WebDriverProvider;
import config.ConfigReader;
import config.TestConfig;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Web browser sessions (tests/ui). Local Chrome by default; pass
 * -DremoteUrl= to run on the Selenoid web hub. This is the desktop-web
 * counterpart of the *MobileDriver providers — device browsers are out of scope here.
 */
public class WebBrowserDriver implements WebDriverProvider {

    @Override
    public WebDriver createDriver(Capabilities ignored) {
        TestConfig config = ConfigReader.testConfig;
        String browser = config.browser();
        if (!"chrome".equalsIgnoreCase(browser)) {
            throw new IllegalArgumentException("browser: chrome only. Got: " + browser);
        }
        ChromeOptions options = new ChromeOptions();
        // Linux CI runners cannot create Chrome's kernel sandbox — same flag
        // the web cell passes to local Chrome.
        options.addArguments("--no-sandbox");
        if (config.headless()) {
            options.addArguments("--headless=new");
        }
        // A custom provider owns the window size — Configuration.browserSize is
        // only wired into Selenide's built-in factories.
        options.addArguments("--window-size=" + windowSize(config.browserSize()));
        // Browser console lands in the "browser" log type — Attach.driverLogs()
        options.setCapability("goog:loggingPrefs", Map.of("browser", "ALL"));
        String remote = config.remoteUrl();
        if (remote == null || remote.isBlank()) {
            return new ChromeDriver(options);
        }
        MutableCapabilities caps = new MutableCapabilities(options);
        caps.setCapability("browserVersion", config.browserVersion());
        Map<String, Object> selenoid = new HashMap<>();
        selenoid.put("enableVNC", config.enableVnc());
        selenoid.put("enableVideo", config.enableVideo());
        caps.setCapability("selenoid:options", selenoid);
        return new RemoteWebDriver(hubUrl(remote), caps);
    }

    private static String windowSize(String browserSize) {
        var parts = (browserSize == null ? "" : browserSize).split("x");
        if (parts.length != 2) {
            throw new IllegalStateException("Invalid browserSize: " + browserSize + " (expected WxH)");
        }
        return parts[0].trim() + "," + parts[1].trim();
    }

    private static java.net.URL hubUrl(String spec) {
        try {
            return URI.create(spec).toURL();
        } catch (IllegalArgumentException | MalformedURLException e) {
            throw new IllegalStateException("Invalid remoteUrl: " + spec, e);
        }
    }
}
