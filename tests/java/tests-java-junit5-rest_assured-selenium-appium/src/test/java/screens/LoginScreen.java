package screens;

import io.qameta.allure.Step;
import org.openqa.selenium.By;

public class LoginScreen extends BaseScreen {

    private final By loginForm = id("login-form");
    private final By loginInput = id("login-input");
    private final By passwordInput = id("password-input");
    private final By submitButton = id("submit-button");
    private final By errorMessage = id("error-message");
    private final By formTitle = id("login-form-title");
    private final By registerLink = id("register-link");

    @Step("Login screen is open")
    public LoginScreen shouldBeOpen() {
        visible(loginForm);
        visible(loginInput);
        visible(passwordInput);
        visible(submitButton);
        return this;
    }

    @Step("Fill and submit login form")
    public HomeScreen fillAndSubmitForm(String username, String password) {
        typeUsername(username);
        typePassword(password);
        return submit();
    }

    @Step("Type username: {username}")
    public LoginScreen typeUsername(String username) {
        type(loginInput, username);
        return this;
    }

    @Step("Type password")
    public LoginScreen typePassword(String password) {
        type(passwordInput, password);
        return this;
    }

    @Step("Submit login form")
    public HomeScreen submit() {
        click(submitButton);
        return new HomeScreen();
    }

    @Step("Submit login form expecting validation error")
    public LoginScreen submitExpectingError() {
        click(submitButton);
        visible(errorMessage);
        return this;
    }

    @Step("Verify error message: {message}")
    public LoginScreen shouldHaveErrorMessage(String message) {
        shouldHaveText(errorMessage, message);
        return this;
    }

    @Step("Verify form title: {message}")
    public LoginScreen shouldHaveFormTitle(String message) {
        shouldHaveText(formTitle, message);
        return this;
    }

    @Step("Open register from the login footer link")
    public RegisterScreen clickRegisterLink() {
        click(registerLink);
        return new RegisterScreen();
    }
}
