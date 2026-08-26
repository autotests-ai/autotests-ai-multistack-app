package pages;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.cssClass;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.value;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.Wait;
import static com.codeborne.selenide.Selenide.localStorage;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.refresh;

import com.codeborne.selenide.SelenideElement;
import helpers.ReactInput;
import io.qameta.allure.Step;

import static pages.PageTimeouts.PAGE_READY;

public class LoginPage {

    private final SelenideElement embeddedHeader = $("[data-testid='header']");
    private final SelenideElement loginForm = $("[data-testid='login-form']");
    private final SelenideElement loginInput = $("[data-testid='login-input']");
    private final SelenideElement passwordInput = $("[data-testid='password-input']");
    private final SelenideElement submitButton = $("[data-testid='submit-button']");
    private final SelenideElement formTitle = $("[data-testid='login-form-title']");
    private final SelenideElement errorMessage = $("[data-testid='error-message']");
    private final SelenideElement langToggle =
            $("[data-testid='header-tools'] [data-testid='header-lang-toggle']");
    private final SelenideElement langLabel =
            $("[data-testid='header-tools'] [data-testid='header-lang-label']");
    private final SelenideElement themeToggle =
            $("[data-testid='header-tools'] [data-testid='header-theme-toggle']");
    private final SelenideElement html = $("html");

    @Step("Open login page")
    public LoginPage openPage() {
        open("/login");
        return shouldShowLoginForm();
    }

    @Step("Fill and submit form")
    public HomePage fillAndSubmitForm(String username, String password) {
        shouldShowLoginForm();
        ReactInput.fillAndSubmitLogin(username, password);
        BrowserUrl.shouldBeAtAppRoot();
        return new HomePage();
    }

    @Step("Type username: {username}")
    public LoginPage typeUsername(String username) {
        loginInput.shouldBe(visible, PAGE_READY);
        ReactInput.setValue(loginInput, username);
        loginInput.shouldHave(value(username));
        return this;
    }

    @Step("Type password")
    public LoginPage typePassword(String password) {
        passwordInput.shouldBe(visible, PAGE_READY);
        ReactInput.setValue(passwordInput, password);
        passwordInput.shouldHave(value(password));
        return this;
    }

    @Step("Submit login form")
    public HomePage submit() {
        submitButton.click();
        BrowserUrl.shouldBeAtAppRoot();
        return new HomePage();
    }

    @Step("Submit login form expecting validation error")
    public LoginPage submitExpectingError() {
        submitButton.click();
        errorMessage.shouldBe(visible, PAGE_READY);
        return this;
    }

    @Step("Verify embedded header is mounted")
    public LoginPage shouldShowEmbeddedHeader() {
        embeddedHeader.shouldBe(visible, PAGE_READY);
        return this;
    }

    @Step("Verify login form is mounted")
    public LoginPage shouldShowLoginForm() {
        formTitle.shouldBe(visible, PAGE_READY);
        loginInput.shouldBe(visible);
        passwordInput.shouldBe(visible);
        submitButton.shouldBe(visible);
        return this;
    }

    @Step("Login form panel is visible")
    public SelenideElement loginFormPanel() {
        return loginForm.shouldBe(visible, PAGE_READY);
    }

    @Step("Reload current page")
    public LoginPage reloadPage() {
        refresh();
        return shouldShowLoginForm();
    }

    @Step("Click language toggle")
    public LoginPage clickLangToggle() {
        langToggle.shouldBe(visible, PAGE_READY).click();
        return this;
    }

    @Step("Click theme toggle")
    public LoginPage clickThemeToggle() {
        themeToggle.shouldBe(visible, PAGE_READY).click();
        return this;
    }

    @Step("Verify language label: {label}")
    public LoginPage shouldHaveLangLabel(String label) {
        langLabel.shouldHave(text(label), PAGE_READY);
        return this;
    }

    @Step("Verify html lang: {lang}")
    public LoginPage shouldHaveHtmlLang(String lang) {
        html.shouldHave(attribute("lang", lang), PAGE_READY);
        Wait().until(driver -> lang.equals(localStorage().getItem("zds-lang")));
        return this;
    }

    @Step("Verify light theme is {light}")
    public LoginPage shouldHaveThemeLight(boolean light) {
        if (light) {
            html.shouldHave(cssClass("theme-light"), PAGE_READY);
            Wait().until(driver -> "light".equals(localStorage().getItem("zds-theme")));
        } else {
            html.shouldNotHave(cssClass("theme-light"), PAGE_READY);
            Wait().until(driver -> !"light".equals(localStorage().getItem("zds-theme")));
        }
        return this;
    }

    @Step("Verify form title message: {message}")
    public LoginPage shouldHaveFormTitle(String message) {
        formTitle.shouldHave(text(message));
        return this;
    }

    @Step("Verify error message: {message}")
    public LoginPage shouldHaveErrorMessage(String message) {
        errorMessage.shouldHave(text(message));
        return this;
    }
}
