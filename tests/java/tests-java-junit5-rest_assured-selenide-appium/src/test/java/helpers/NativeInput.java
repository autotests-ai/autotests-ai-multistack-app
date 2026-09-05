package helpers;

import com.codeborne.selenide.SelenideElement;
import com.codeborne.selenide.WebDriverRunner;
import config.AppPlatform;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.HidesKeyboard;

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
        if (AppPlatform.current() == AppPlatform.IOS) {
            // Keyboard covers the lower Register plaques (password + confirm).
            // A click then sendKeys hits the keyboard, not the field — password
            // stays short and the suite sees "must be at least 6 characters".
            dismissIosKeyboard();
            field.shouldBe(visible).click();
            field.sendKeys(value);
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
        if (AppPlatform.current() == AppPlatform.IOS) {
            blurTarget.shouldBe(visible).click();
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
                title.click();
                return;
            }
        }
    }

    public static void hideKeyboard() {
        if (AppPlatform.current() != AppPlatform.ANDROID) {
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
}
