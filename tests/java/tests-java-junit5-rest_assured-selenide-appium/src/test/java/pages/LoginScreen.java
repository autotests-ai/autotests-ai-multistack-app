package pages;

import com.codeborne.selenide.SelenideElement;
import io.appium.java_client.AppiumBy;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

public class LoginScreen {

    private final SelenideElement loginForm = $(AppiumBy.accessibilityId("login-form"));
    private final SelenideElement loginInput = $(AppiumBy.accessibilityId("login-input"));
    private final SelenideElement passwordInput = $(AppiumBy.accessibilityId("password-input"));
    private final SelenideElement submitButton = $(AppiumBy.accessibilityId("submit-button"));
    private final SelenideElement errorMessage = $(AppiumBy.accessibilityId("error-message"));
    private final SelenideElement formTitle = $(AppiumBy.accessibilityId("login-form-title"));
    private final SelenideElement registerLink = $(AppiumBy.accessibilityId("register-link"));

    @Step("Login screen is open")
    public LoginScreen shouldBeOpen() {
        loginForm.shouldBe(visible);
        loginInput.shouldBe(visible);
        passwordInput.shouldBe(visible);
        submitButton.shouldBe(visible);
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
        loginInput.setValue(username);
        return this;
    }

    @Step("Type password")
    public LoginScreen typePassword(String password) {
        passwordInput.setValue(password);
        return this;
    }

    @Step("Submit login form")
    public HomeScreen submit() {
        submitButton.click();
        return new HomeScreen();
    }

    @Step("Submit login form expecting validation error")
    public LoginScreen submitExpectingError() {
        submitButton.click();
        errorMessage.shouldBe(visible);
        return this;
    }

    @Step("Verify error message: {message}")
    public LoginScreen shouldHaveErrorMessage(String message) {
        errorMessage.shouldHave(text(message));
        return this;
    }

    @Step("Verify form title: {message}")
    public LoginScreen shouldHaveFormTitle(String message) {
        formTitle.shouldHave(text(message));
        return this;
    }

    @Step("Open register from the login footer link")
    public RegisterScreen clickRegisterLink() {
        registerLink.click();
        return new RegisterScreen();
    }
}
