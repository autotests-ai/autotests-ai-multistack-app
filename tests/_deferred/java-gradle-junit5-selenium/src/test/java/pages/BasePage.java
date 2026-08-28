package pages;

import config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Shared waits, navigation, one native type policy and one native click policy.
 */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final TestConfig config;
    protected final Duration timeout;

    protected BasePage(WebDriver driver, TestConfig config) {
        this(driver, config, Duration.ofSeconds(5));
    }

    protected BasePage(WebDriver driver, TestConfig config, Duration timeout) {
        this.driver = driver;
        this.config = config;
        this.timeout = timeout;
    }

    protected WebDriverWait driverWait() {
        return new WebDriverWait(driver, timeout);
    }

    protected void openPath(String path) {
        String base = config.webBaseUrl();
        String suffix = path.startsWith("/") ? path : "/" + path;
        driver.get(base + suffix);
    }

    protected WebElement waitVisible(By locator) {
        return driverWait().until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitClickable(By locator) {
        return driverWait().until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void waitTextContains(By locator, String fragment) {
        driverWait().until(ExpectedConditions.textToBePresentInElementLocated(locator, fragment));
    }

    protected void type(By locator, String text) {
        WebElement el = waitVisible(locator);
        el.clear();
        el.sendKeys(text);
    }

    protected void click(By locator) {
        waitClickable(locator).click();
    }
}
