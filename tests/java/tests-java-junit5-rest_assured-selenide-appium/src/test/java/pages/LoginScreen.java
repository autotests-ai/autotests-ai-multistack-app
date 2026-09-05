package pages;

import com.codeborne.selenide.SelenideElement;
import helpers.NativeInput;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class LoginScreen {

    private final SelenideElement loginForm = $(id("login-form"));
    private final SelenideElement loginInput = $(id("login-input"));
    private final SelenideElement passwordInput = $(id("password-input"));
    private final SelenideElement submitButton = $(id("submit-button"));
    private final SelenideElement errorMessage = $(id("error-message"));
    private final SelenideElement formTitle = $(id("login-form-title"));
    private final SelenideElement registerLink = $(id("register-link"));

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
        NativeInput.typeInto(loginInput, username);
        return this;
    }

    @Step("Type password")
    public LoginScreen typePassword(String password) {
        NativeInput.typeInto(passwordInput, password);
        return this;
    }

    @Step("Submit login form")
    public HomeScreen submit() {
        NativeInput.dismissIme(formTitle);
        submitButton.shouldBe(visible).click();
        return new HomeScreen();
    }

    @Step("Submit login form expecting validation error")
    public LoginScreen submitExpectingError() {
        NativeInput.dismissIme(formTitle);
        submitButton.shouldBe(visible).click();
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
        NativeInput.dismissIme(formTitle);
        registerLink.shouldBe(visible).click();
        return new RegisterScreen();
    }
}
