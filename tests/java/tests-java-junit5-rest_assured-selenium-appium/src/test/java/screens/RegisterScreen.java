package screens;

import io.qameta.allure.Step;
import org.openqa.selenium.By;

public class RegisterScreen extends BaseScreen {

    private final By registerForm = id("register-form");
    private final By loginInput = id("register-login-input");
    private final By passwordInput = id("register-password-input");
    private final By confirmPasswordInput = id("confirm-password-input");
    private final By submitButton = id("register-submit-button");
    private final By errorMessage = id("register-error-message");

    @Step("Register screen is open")
    public RegisterScreen shouldBeOpen() {
        visible(registerForm);
        visible(loginInput);
        visible(passwordInput);
        visible(confirmPasswordInput);
        visible(submitButton);
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
        type(loginInput, username);
        return this;
    }

    @Step("Type password")
    public RegisterScreen typePassword(String password) {
        type(passwordInput, password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterScreen typeConfirmPassword(String confirmPassword) {
        type(confirmPasswordInput, confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomeScreen submit() {
        click(submitButton);
        return new HomeScreen();
    }

    @Step("Submit register form expecting validation or API error")
    public RegisterScreen submitExpectingError() {
        click(submitButton);
        visible(errorMessage);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterScreen shouldHaveErrorMessage(String message) {
        shouldHaveText(errorMessage, message);
        return this;
    }
}
