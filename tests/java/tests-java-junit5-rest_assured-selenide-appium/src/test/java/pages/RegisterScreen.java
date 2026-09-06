package pages;

import com.codeborne.selenide.SelenideElement;
import io.appium.java_client.AppiumBy;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

public class RegisterScreen {

    private final SelenideElement registerForm = $(AppiumBy.accessibilityId("register-form"));
    private final SelenideElement loginInput = $(AppiumBy.accessibilityId("register-login-input"));
    private final SelenideElement passwordInput = $(AppiumBy.accessibilityId("register-password-input"));
    private final SelenideElement confirmPasswordInput = $(AppiumBy.accessibilityId("confirm-password-input"));
    private final SelenideElement submitButton = $(AppiumBy.accessibilityId("register-submit-button"));
    private final SelenideElement errorMessage = $(AppiumBy.accessibilityId("register-error-message"));

    @Step("Register screen is open")
    public RegisterScreen shouldBeOpen() {
        registerForm.shouldBe(visible);
        loginInput.shouldBe(visible);
        passwordInput.shouldBe(visible);
        confirmPasswordInput.shouldBe(visible);
        submitButton.shouldBe(visible);
        return this;
    }

    @Step("Fill and submit register form")
    public HomeScreen fillAndSubmitForm(String username, String password, String confirmPassword) {
        typeUsername(username);
        typePassword(password);
        typeConfirmPassword(confirmPassword);
        return submit();
    }

    @Step("Type username: {username}")
    public RegisterScreen typeUsername(String username) {
        loginInput.setValue(username);
        return this;
    }

    @Step("Type password")
    public RegisterScreen typePassword(String password) {
        passwordInput.setValue(password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterScreen typeConfirmPassword(String confirmPassword) {
        confirmPasswordInput.setValue(confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomeScreen submit() {
        submitButton.click();
        return new HomeScreen();
    }

    @Step("Submit register form expecting validation or API error")
    public RegisterScreen submitExpectingError() {
        submitButton.click();
        errorMessage.shouldBe(visible);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterScreen shouldHaveErrorMessage(String message) {
        errorMessage.shouldHave(text(message));
        return this;
    }
}
