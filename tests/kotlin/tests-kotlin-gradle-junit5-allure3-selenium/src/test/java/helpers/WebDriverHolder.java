package helpers;

import org.openqa.selenium.WebDriver;

public final class WebDriverHolder {

    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

    private WebDriverHolder() {
    }

    public static void set(WebDriver driver) {
        DRIVER.set(driver);
    }

    public static WebDriver get() {
        var driver = DRIVER.get();
        if (driver == null) {
            throw new IllegalStateException("WebDriver is not started");
        }
        return driver;
    }

    public static boolean has() {
        return DRIVER.get() != null;
    }

    public static void quit() {
        var driver = DRIVER.get();
        if (driver == null) {
            return;
        }
        try {
            driver.quit();
        } finally {
            DRIVER.remove();
        }
    }
}
