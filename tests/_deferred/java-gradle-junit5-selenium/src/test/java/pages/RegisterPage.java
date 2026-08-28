package pages;

import config.TestConfig;
import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class RegisterPage extends BasePage {

    private static final By REGISTER_FORM = By.cssSelector("[data-testid='register-form']");
    private static final By LOGIN_INPUT = By.cssSelector("[data-testid='register-login-input']");
    private static final By PASSWORD_INPUT = By.cssSelector("[data-testid='register-password-input']");
    private static final By CONFIRM_PASSWORD = By.cssSelector("[data-testid='confirm-password-input']");
    private static final By SUBMIT = By.cssSelector("[data-testid='register-submit-button']");
    private static final By LOGIN_LINK = By.cssSelector("[data-testid='login-link']");

    public RegisterPage(WebDriver driver, TestConfig config) {
        super(driver, config);
    }

    @Step("Open register page")
    public RegisterPage openPage() {
        openPath("/register");
        return shouldBeOpen();
    }

    @Step("Click 'Login' link under the register form")
    public LoginPage clickLoginLink() {
        click(LOGIN_LINK);
        return new LoginPage(driver, config);
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
        type(LOGIN_INPUT, username);
        return this;
    }

    @Step("Type password")
    public RegisterPage typePassword(String password) {
        type(PASSWORD_INPUT, password);
        return this;
    }

    @Step("Type confirm password")
    public RegisterPage typeConfirmPassword(String confirmPassword) {
        type(CONFIRM_PASSWORD, confirmPassword);
        return this;
    }

    @Step("Submit register form")
    public HomePage submit() {
        click(SUBMIT);
        return new HomePage(driver, config);
    }

    @Step("Verify register page is open")
    public RegisterPage shouldBeOpen() {
        waitVisible(REGISTER_FORM);
        return this;
    }
}
