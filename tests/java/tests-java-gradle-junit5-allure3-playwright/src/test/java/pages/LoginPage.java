package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import io.qameta.allure.Step;

public class LoginPage {

    private final Page page;
    public final Locator loginForm;
    public final Locator loginInput;
    public final Locator passwordInput;
    public final Locator submitButton;
    public final Locator formTitle;
    public final Locator errorMessage;
    public final Locator registerLink;

    public LoginPage(Page page) {
        this.page = page;
        this.loginForm = page.getByTestId("login-form");
        this.loginInput = page.getByTestId("login-input");
        this.passwordInput = page.getByTestId("password-input");
        this.submitButton = page.getByTestId("submit-button");
        this.formTitle = page.getByTestId("login-form-title");
        this.errorMessage = page.getByTestId("error-message");
        this.registerLink = page.getByTestId("register-link");
    }

    @Step("Open login page")
    public LoginPage open() {
        page.navigate("login");
        return shouldBeOpen();
    }

    @Step("Verify login page is open")
    public LoginPage shouldBeOpen() {
        loginForm.waitFor();
        return this;
    }

    @Step("Verify login form is mounted")
    public LoginPage shouldShowLoginForm() {
        formTitle.waitFor();
        loginInput.waitFor();
        passwordInput.waitFor();
        submitButton.waitFor();
        return this;
    }

    @Step("Fill login form as {username}")
    public LoginPage login(String username, String password) {
        loginInput.fill(username);
        passwordInput.fill(password);
        submitButton.click();
        return this;
    }

    @Step("Type username: {username}")
    public LoginPage typeUsername(String username) {
        loginInput.fill(username);
        return this;
    }

    @Step("Type password")
    public LoginPage typePassword(String password) {
        passwordInput.fill(password);
        return this;
    }

    @Step("Submit login form expecting validation error")
    public LoginPage submitExpectingError() {
        submitButton.click();
        errorMessage.waitFor();
        return this;
    }

    @Step("Click Register link under the login form")
    public LoginPage clickRegisterLink() {
        registerLink.click();
        return this;
    }

    @Step("Reload current page")
    public LoginPage reload() {
        page.reload();
        return shouldBeOpen();
    }
}
