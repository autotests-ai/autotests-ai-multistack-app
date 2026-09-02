package pages;

import helpers.Ui;
import io.qameta.allure.Step;

public class RegisterPage extends BasePage<RegisterPage> {

    @Step("Open register page")
    public RegisterPage openPage() {
        Ui.open("/register");
        return shouldBeOpen();
    }

    @Step("Click Login link under the register form")
    public LoginPage clickLoginLink() {
        Ui.click("login-link");
        return new LoginPage();
    }

    @Step("Fill and submit register form")
    public HomePage fillAndSubmitForm(String username, String password, String confirmPassword) {
        typeUsername(username);
        typePassword(password);
        typeConfirmPassword(confirmPassword);
        return submit();
    }

    @Step("Type username: {username}")
    public RegisterPage typeUsername(String username) {
        Ui.setValue("register-login-input", username);
        return this;
    }

    @Step("Type password")
    public RegisterPage typePassword(String password) {
        Ui.setValue("register-password-input", password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterPage typeConfirmPassword(String confirmPassword) {
        Ui.setValue("confirm-password-input", confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomePage submit() {
        Ui.click("register-submit-button");
        return new HomePage();
    }

    @Step("Submit register form expecting validation or API error")
    public RegisterPage submitExpectingError() {
        Ui.click("register-submit-button");
        Ui.shouldBeVisible("register-error-message");
        return this;
    }

    @Override
    @Step("Verify register page is open")
    public RegisterPage shouldBeOpen() {
        Ui.shouldBeVisible("register-form");
        return this;
    }

    @Step("Verify register form is mounted")
    public RegisterPage shouldShowRegisterForm() {
        Ui.shouldBeVisible("register-form-title");
        Ui.shouldBeVisible("register-login-input");
        Ui.shouldBeVisible("register-password-input");
        Ui.shouldBeVisible("confirm-password-input");
        Ui.shouldBeVisible("register-submit-button");
        return this;
    }

    @Step("Verify form title message: {message}")
    public RegisterPage shouldHaveFormTitle(String message) {
        Ui.shouldHaveText("register-form-title", message);
        return this;
    }

    @Step("Verify error message: {message}")
    public RegisterPage shouldHaveErrorMessage(String message) {
        Ui.shouldBeVisible("register-error-message");
        Ui.shouldHaveText("register-error-message", message);
        return this;
    }
}
