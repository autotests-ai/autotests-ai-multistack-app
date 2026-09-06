package pages;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class RegisterScreen {

    private final SelenideElement registerForm = $(id("register-form"));
    private final SelenideElement loginInput = $(id("register-login-input"));
    private final SelenideElement passwordInput = $(id("register-password-input"));
    private final SelenideElement confirmPasswordInput = $(id("confirm-password-input"));
    private final SelenideElement submitButton = $(id("register-submit-button"));
    private final SelenideElement errorMessage = $(id("register-error-message"));

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
        loginInput.shouldBe(visible).sendKeys(username);
        return this;
    }

    @Step("Type password")
    public RegisterScreen typePassword(String password) {
        passwordInput.shouldBe(visible).sendKeys(password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterScreen typeConfirmPassword(String confirmPassword) {
        confirmPasswordInput.shouldBe(visible).sendKeys(confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomeScreen submit() {
        submitButton.shouldBe(visible).click();
        return new HomeScreen();
    }

    @Step("Submit register form expecting validation or API error")
    public RegisterScreen submitExpectingError() {
        submitButton.shouldBe(visible).click();
        errorMessage.shouldBe(visible);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterScreen shouldHaveErrorMessage(String message) {
        errorMessage.shouldHave(text(message));
        return this;
    }
}
