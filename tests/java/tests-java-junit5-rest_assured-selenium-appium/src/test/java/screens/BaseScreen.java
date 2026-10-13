package screens;

import drivers.mobile.MobileDriver;
import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/** Explicit waits over Compose testIds (accessibility ids) — no implicit waits, no sleeps. */
abstract class BaseScreen {

    static final Duration TIMEOUT = Duration.ofSeconds(30);

    static By id(String testId) {
        return AppiumBy.accessibilityId(testId);
    }

    static WebElement visible(By locator) {
        return new WebDriverWait(MobileDriver.get(), TIMEOUT)
                .until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    static void click(By locator) {
        new WebDriverWait(MobileDriver.get(), TIMEOUT)
                .until(ExpectedConditions.elementToBeClickable(locator))
                .click();
    }

    static void type(By locator, String value) {
        WebElement field = visible(locator);
        field.clear();
        field.sendKeys(value);
    }

    static void shouldHaveText(By locator, String expected) {
        new WebDriverWait(MobileDriver.get(), TIMEOUT)
                .withMessage(() -> locator + " should contain text '" + expected + "'")
                .until(ExpectedConditions.textToBePresentInElementLocated(locator, expected));
    }
}
