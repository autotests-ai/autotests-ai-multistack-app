package pages;

import helpers.Ui;
import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

public class LoginPage extends BasePage<LoginPage> {

    @Step("Open login page")
    public LoginPage openPage() {
        Ui.open("/login");
        return shouldBeOpen();
    }

    @Step("Click Register link under the login form")
    public RegisterPage clickRegisterLink() {
        Ui.click("register-link");
        return new RegisterPage();
    }

    @Step("Fill and submit form")
    public HomePage fillAndSubmitForm(String username, String password) {
        typeUsername(username);
        typePassword(password);
        return submit();
    }

    @Step("Type username: {username}")
    public LoginPage typeUsername(String username) {
        Ui.setValue("login-input", username);
        return this;
    }

    @Step("Type password")
    public LoginPage typePassword(String password) {
        Ui.setValue("password-input", password);
        return this;
    }

    @Step("Submit login form")
    public HomePage submit() {
        Ui.click("submit-button");
        return new HomePage();
    }

    @Step("Submit login form expecting validation error")
    public LoginPage submitExpectingError() {
        Ui.click("submit-button");
        Ui.shouldBeVisible("error-message");
        return this;
    }

    @Override
    @Step("Verify login page is open")
    public LoginPage shouldBeOpen() {
        Ui.shouldBeVisible("login-form");
        return this;
    }

    @Step("Verify login form is mounted")
    public LoginPage shouldShowLoginForm() {
        Ui.shouldBeVisible("login-form-title");
        Ui.shouldBeVisible("login-input");
        Ui.shouldBeVisible("password-input");
        Ui.shouldBeVisible("submit-button");
        return this;
    }

    @Step("Login form panel is visible")
    public WebElement loginFormPanel() {
        return Ui.el("login-form");
    }

    @Step("Verify form title message: {message}")
    public LoginPage shouldHaveFormTitle(String message) {
        Ui.shouldHaveText("login-form-title", message);
        return this;
    }

    @Step("Verify error message: {message}")
    public LoginPage shouldHaveErrorMessage(String message) {
        Ui.shouldHaveText("error-message", message);
        return this;
    }
}
