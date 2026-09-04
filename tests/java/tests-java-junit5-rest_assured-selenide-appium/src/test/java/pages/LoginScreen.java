package pages;

import com.codeborne.selenide.SelenideElement;
import com.codeborne.selenide.WebDriverRunner;
import config.AppPlatform;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.HidesKeyboard;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class LoginScreen {

    private final SelenideElement loginForm = $(id("login-form"));
    private final SelenideElement loginInput = $(id("login-input"));
    private final SelenideElement passwordInput = $(id("password-input"));
    private final SelenideElement submitButton = $(id("submit-button"));

    @Step("Login screen is open")
    public LoginScreen shouldBeOpen() {
        loginForm.shouldBe(visible);
        loginInput.shouldBe(visible);
        passwordInput.shouldBe(visible);
        submitButton.shouldBe(visible);
        return this;
    }

    @Step("Fill and submit login form")
    public HomeScreen fillAndSubmitForm(String username, String password) {
        typeInto(loginInput, username);
        typeInto(passwordInput, password);
        hideKeyboard();
        submitButton.shouldBe(visible).click();
        return new HomeScreen();
    }

    /**
     * Compose puts {@code contentDescription} on the semantics node, which
     * UiAutomator will not treat as an {@code EditText}. Click the testid, then
     * type into the focused field (the same string works as iOS identifier).
     */
    private static void typeInto(SelenideElement field, String value) {
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

    private static void hideKeyboard() {
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
