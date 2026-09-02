package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import io.qameta.allure.Step;

public class RegisterPage {

    private final Page page;
    public final Locator registerForm;
    public final Locator loginInput;
    public final Locator passwordInput;
    public final Locator confirmPasswordInput;
    public final Locator submitButton;
    public final Locator formTitle;
    public final Locator errorMessage;
    public final Locator loginLink;

    public RegisterPage(Page page) {
        this.page = page;
        this.registerForm = page.getByTestId("register-form");
        this.loginInput = page.getByTestId("register-login-input");
        this.passwordInput = page.getByTestId("register-password-input");
        this.confirmPasswordInput = page.getByTestId("confirm-password-input");
        this.submitButton = page.getByTestId("register-submit-button");
        this.formTitle = page.getByTestId("register-form-title");
        this.errorMessage = page.getByTestId("register-error-message");
        this.loginLink = page.getByTestId("login-link");
    }

    @Step("Open register page")
    public RegisterPage open() {
        page.navigate("register");
        return shouldBeOpen();
    }

    @Step("Verify register page is open")
    public RegisterPage shouldBeOpen() {
        registerForm.waitFor();
        return this;
    }

    @Step("Verify register form is mounted")
    public RegisterPage shouldShowRegisterForm() {
        formTitle.waitFor();
        loginInput.waitFor();
        passwordInput.waitFor();
        confirmPasswordInput.waitFor();
        submitButton.waitFor();
        return this;
    }

    @Step("Sign up as {username}")
    public RegisterPage signup(String username, String password) {
        return signup(username, password, password);
    }

    @Step("Sign up as {username}")
    public RegisterPage signup(String username, String password, String confirmPassword) {
        loginInput.fill(username);
        passwordInput.fill(password);
        confirmPasswordInput.fill(confirmPassword);
        submitButton.click();
        return this;
    }

    @Step("Type username: {username}")
    public RegisterPage typeUsername(String username) {
        loginInput.fill(username);
        return this;
    }

    @Step("Type password")
    public RegisterPage typePassword(String password) {
        passwordInput.fill(password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterPage typeConfirmPassword(String password) {
        confirmPasswordInput.fill(password);
        return this;
    }

    @Step("Submit register form expecting validation error")
    public RegisterPage submitExpectingError() {
        submitButton.click();
        errorMessage.waitFor();
        return this;
    }

    @Step("Click Login link under the register form")
    public RegisterPage clickLoginLink() {
        loginLink.click();
        return this;
    }
}
