package pages;

import com.codeborne.selenide.SelenideElement;
import helpers.NativeInput;
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
    private final SelenideElement formTitle = $(id("register-form-title"));

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
        NativeInput.typeInto(loginInput, username);
        return this;
    }

    @Step("Type password")
    public RegisterScreen typePassword(String password) {
        NativeInput.typeInto(passwordInput, password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterScreen typeConfirmPassword(String confirmPassword) {
        NativeInput.typeInto(confirmPasswordInput, confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomeScreen submit() {
        blurIme();
        submitButton.shouldBe(visible).click();
        return new HomeScreen();
    }

    @Step("Submit register form expecting validation or API error")
    public RegisterScreen submitExpectingError() {
        blurIme();
        submitButton.shouldBe(visible).click();
        errorMessage.shouldBe(visible);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterScreen shouldHaveErrorMessage(String message) {
        errorMessage.shouldHave(text(message));
        return this;
    }

    /**
     * Appium {@code hideKeyboard} sends Back. On this screen Back is
     * {@code AppState.back()} → login, so the submit button disappears.
     * Tap the title instead: it blurs the focused field without leaving.
     */
    private void blurIme() {
        formTitle.shouldBe(visible).click();
    }
}
