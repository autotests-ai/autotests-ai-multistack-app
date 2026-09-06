package helpers;

import com.codeborne.selenide.SelenideElement;
import com.codeborne.selenide.WebDriverRunner;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.HidesKeyboard;
import org.openqa.selenium.WebElement;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

/**
 * Compose puts {@code contentDescription} on the semantics node, which
 * UiAutomator will not treat as an {@code EditText}. Click the testid, then
 * type into the focused field (the same string works as iOS identifier).
 */
public final class NativeInput {

    private NativeInput() {
    }

    public static void typeInto(SelenideElement field, String value) {
        if (ios()) {
            // Selenide click() can hit the IME, not the SecureField. W3C
            // click+value is what actually updates the SwiftUI binding.
            dismissIosKeyboard();
            WebElement el = field.shouldBe(visible).toWebElement();
            el.click();
            el.sendKeys(value);
            return;
        }
        field.shouldBe(visible).click();
        $(AppiumBy.androidUIAutomator(
                "new UiSelector().className(\"android.widget.EditText\").focused(true)"))
                .shouldBe(visible)
                .sendKeys(value);
    }

    /**
     * Dismiss IME without leaving the screen. Android {@code hideKeyboard}
     * sends Back; on Register that is {@code AppState.back()} → login.
     * iOS never uses that call — tap a non-nav control (the form title) instead.
     */
    public static void dismissIme(SelenideElement blurTarget) {
        if (ios()) {
            blurTarget.shouldBe(visible).toWebElement().click();
            return;
        }
        hideKeyboard();
    }

    /**
     * Tap the form title (empty action) — same as {@link #dismissIme}. Do not
     * call Appium {@code hideKeyboard}: with {@code submitLabel(.go)} that
     * presses Go and submits the form.
     */
    private static void dismissIosKeyboard() {
        for (String testId : new String[] {"register-form-title", "login-form-title"}) {
            SelenideElement title = $(AppiumBy.accessibilityId(testId));
            if (title.exists()) {
                title.toWebElement().click();
                return;
            }
        }
    }

    public static void hideKeyboard() {
        if (ios()) {
            return;
        }
        var driver = WebDriverRunner.getWebDriver();
        if (driver instanceof HidesKeyboard hides) {
            try {
                hides.hideKeyboard();
            } catch (Exception ignored) {
                // already hidden
            }
        }
    }

    private static boolean ios() {
        return "ios".equalsIgnoreCase(System.getProperty("platform", "android"));
    }
}
