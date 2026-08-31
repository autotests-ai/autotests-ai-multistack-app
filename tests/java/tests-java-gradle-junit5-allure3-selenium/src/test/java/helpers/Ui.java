package helpers;

import config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.function.Function;

/**
 * Thin Selenium wait/locator helpers so page objects stay fluent without Selenide.
 */
public final class Ui {

    public static final Duration TIMEOUT = Duration.ofSeconds(5);

    private Ui() {
    }

    public static WebDriver driver() {
        return WebDriverHolder.get();
    }

    public static void open(String path) {
        var base = ConfigReader.resolveBaseUrl();
        if (path == null || path.isBlank() || "/".equals(path)) {
            driver().get(base);
            return;
        }
        var relative = path.startsWith("/") ? path.substring(1) : path;
        driver().get(URI.create(base).resolve(relative).toString());
    }

    public static void refresh() {
        driver().navigate().refresh();
    }

    public static By testId(String id) {
        return By.cssSelector("[data-testid='" + id + "']");
    }

    public static WebElement el(By locator) {
        return waitUntil(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement el(String testId) {
        return el(testId(testId));
    }

    public static List<WebElement> all(By locator) {
        return driver().findElements(locator);
    }

    public static void click(By locator) {
        waitUntil(ExpectedConditions.elementToBeClickable(locator)).click();
    }

    public static void click(String testId) {
        click(testId(testId));
    }

    public static void setValue(By locator, String value) {
        var element = el(locator);
        element.clear();
        element.sendKeys(value == null ? "" : value);
    }

    public static void setValue(String testId, String value) {
        setValue(testId(testId), value);
    }

    public static void shouldBeVisible(By locator) {
        waitUntil(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static void shouldBeVisible(String testId) {
        shouldBeVisible(testId(testId));
    }

    public static void shouldBeHidden(By locator) {
        waitUntil(ExpectedConditions.invisibilityOfElementLocated(locator));
    }

    public static void shouldHaveText(By locator, String text) {
        waitUntil(driver -> {
            var elements = driver.findElements(locator);
            if (elements.isEmpty() || !elements.get(0).isDisplayed()) {
                return false;
            }
            return elements.get(0).getText().contains(text);
        });
    }

    public static void shouldHaveText(String testId, String text) {
        shouldHaveText(testId(testId), text);
    }

    public static void shouldHaveAttribute(By locator, String name, String value) {
        waitUntil(driver -> {
            var found = driver.findElements(locator);
            if (found.isEmpty()) {
                return false;
            }
            var actual = found.get(0).getAttribute(name);
            if (value == null || value.isEmpty()) {
                return actual != null;
            }
            return value.equals(actual);
        });
    }

    public static void shouldHaveAttribute(String testId, String name, String value) {
        shouldHaveAttribute(testId(testId), name, value);
    }

    public static void shouldHaveCssClass(By locator, String cssClass) {
        waitUntil(driver -> hasClass(driver.findElements(locator), cssClass));
    }

    public static void shouldNotHaveCssClass(By locator, String cssClass) {
        waitUntil(driver -> !hasClass(driver.findElements(locator), cssClass));
    }

    private static boolean hasClass(java.util.List<org.openqa.selenium.WebElement> found, String cssClass) {
        if (found.isEmpty()) {
            return false;
        }
        var classes = found.get(0).getAttribute("class");
        if (classes == null) {
            return false;
        }
        for (var token : classes.split("\\s+")) {
            if (token.equals(cssClass)) {
                return true;
            }
        }
        return false;
    }

    public static Object js(String script, Object... args) {
        return ((JavascriptExecutor) driver()).executeScript(script, args);
    }

    public static <T> T waitUntil(Function<WebDriver, T> condition) {
        return new WebDriverWait(driver(), TIMEOUT).until(condition);
    }
}
