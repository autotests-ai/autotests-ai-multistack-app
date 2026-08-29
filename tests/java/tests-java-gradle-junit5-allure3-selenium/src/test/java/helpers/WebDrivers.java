package helpers;

import config.ConfigReader;
import config.TestConfig;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.SessionNotCreatedException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.Optional;

public final class WebDrivers {

    private static final int SESSION_ATTEMPTS = 3;
    private static final long SESSION_RETRY_DELAY_MS = 3_000;

    private WebDrivers() {
    }

    public static void startBlank() {
        if (WebDriverHolder.has()) {
            return;
        }
        start();
        WebDriverHolder.get().get("about:blank");
    }

    public static void ensureSession() {
        if (WebDriverHolder.has()) {
            return;
        }
        for (int attempt = 1; ; attempt++) {
            try {
                start();
                WebDriverHolder.get().get(ConfigReader.resolveBaseUrl());
                return;
            } catch (SessionNotCreatedException hubRefusedSession) {
                WebDriverHolder.quit();
                if (attempt >= SESSION_ATTEMPTS) {
                    throw hubRefusedSession;
                }
                sleep(SESSION_RETRY_DELAY_MS);
            }
        }
    }

    public static void start() {
        if (WebDriverHolder.has()) {
            return;
        }
        var config = ConfigReader.testConfig;
        var driver = create(config);
        applyWindowSize(driver, config);
        WebDriverHolder.set(driver);
    }

    private static WebDriver create(TestConfig config) {
        var remote = resolveRemoteUrl(config);
        var options = chromeOptions(config, remote.isEmpty());
        if (!remote.isEmpty()) {
            try {
                return new RemoteWebDriver(URI.create(remote).toURL(), options);
            } catch (Exception e) {
                throw new IllegalStateException("Cannot open remote WebDriver at " + remote, e);
            }
        }
        var pin = LocalChromePin.resolve(config.browserVersion());
        options.setBinary(pin.chrome().toString());
        System.setProperty("webdriver.chrome.driver", pin.driver().toString());
        return new ChromeDriver(options);
    }

    private static ChromeOptions chromeOptions(TestConfig config, boolean local) {
        var options = new ChromeOptions();
        if (config.headless()) {
            options.addArguments("--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
        } else if (local) {
            options.addArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
        }
        if (!local) {
            options.setBrowserVersion(config.browserVersion());
            var selenoidOpts = new HashMap<String, Object>();
            selenoidOpts.put("enableVNC", config.enableVnc());
            selenoidOpts.put("enableVideo", config.enableVideo());
            options.setCapability("selenoid:options", selenoidOpts);
        }
        return options;
    }

    private static String resolveRemoteUrl(TestConfig config) {
        var fromEnv = Optional.ofNullable(System.getenv("SELENOID_WEBDRIVER_URL")).orElse("").trim();
        if (!fromEnv.isEmpty()) {
            return fromEnv;
        }
        return config.remoteUrl().trim();
    }

    private static void applyWindowSize(WebDriver driver, TestConfig config) {
        var parts = config.browserSize().split("x");
        if (parts.length != 2) {
            return;
        }
        driver.manage().window().setSize(new Dimension(
                Integer.parseInt(parts[0].trim()),
                Integer.parseInt(parts[1].trim())));
        driver.manage().timeouts().implicitlyWait(Duration.ZERO);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
