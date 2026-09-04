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
        field.shouldBe(visible).click();
        if (AppPlatform.current() == AppPlatform.ANDROID) {
            $(AppiumBy.androidUIAutomator(
                    "new UiSelector().className(\"android.widget.EditText\").focused(true)"))
                    .shouldBe(visible)
                    .sendKeys(value);
            return;
        }
        field.sendKeys(value);
    }

    public static void hideKeyboard() {
        var driver = WebDriverRunner.getWebDriver();
        if (driver instanceof HidesKeyboard hides) {
            try {
                hides.hideKeyboard();
            } catch (Exception ignored) {
                // iOS software keyboard, or already hidden
            }
        }
    }
}
