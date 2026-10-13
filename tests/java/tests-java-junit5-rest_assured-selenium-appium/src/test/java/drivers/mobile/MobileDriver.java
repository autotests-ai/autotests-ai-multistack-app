package drivers.mobile;

import config.ConfigReader;
import io.appium.java_client.AppiumDriver;

/**
 * One Appium session per test thread. -DdeviceHost= picks the factory;
 * -Dplatform= is an axis inside it. Farm parallelism runs tests on several
 * threads of one JVM, hence the ThreadLocal.
 */
public final class MobileDriver {

    private static final ThreadLocal<AppiumDriver> DRIVER = new ThreadLocal<>();

    private MobileDriver() {
    }

    public static AppiumDriver start() {
        AppiumDriver driver = switch (System.getProperty("deviceHost")) {
            case "emulator", "real", "simulator" -> LocalMobileDriver.create(ConfigReader.testConfig);
            case "selenoid" -> SelenoidMobileDriver.create(ConfigReader.testConfig);
            case "browserstack" -> BrowserstackMobileDriver.create(ConfigReader.testConfig);
            default -> throw new IllegalArgumentException(
                    "deviceHost: emulator, real, simulator (local Appium), selenoid, browserstack. Got: "
                            + System.getProperty("deviceHost"));
        };
        DRIVER.set(driver);
        return driver;
    }

    public static AppiumDriver get() {
        AppiumDriver driver = DRIVER.get();
        if (driver == null) {
            throw new IllegalStateException("No Appium session on this thread — MobileTestBase starts it");
        }
        return driver;
    }

    public static boolean started() {
        return DRIVER.get() != null;
    }

    public static void quit() {
        AppiumDriver driver = DRIVER.get();
        DRIVER.remove();
        if (driver != null) {
            driver.quit();
        }
    }
}
