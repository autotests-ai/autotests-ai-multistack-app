package pages;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.cssClass;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.Wait;
import static com.codeborne.selenide.Selenide.localStorage;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.refresh;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

public class HeaderComponent {

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

    @Step("Verify embedded header is mounted")
    public LoginPage shouldShowEmbeddedHeader() {
        embeddedHeader.shouldBe(visible);
        return this;
    }

    @Step("Click language toggle")
    public LoginPage clickLangToggle() {
        langToggle.shouldBe(visible).click();
        return this;
    }

    @Step("Click theme toggle")
    public LoginPage clickThemeToggle() {
        themeToggle.shouldBe(visible).click();
        return this;
    }

    @Step("Verify language label: {label}")
    public LoginPage shouldHaveLangLabel(String label) {
        langLabel.shouldHave(text(label));
        return this;
    }

    @Step("Verify html lang: {lang}")
    public LoginPage shouldHaveHtmlLang(String lang) {
        html.shouldHave(attribute("lang", lang));
        Wait().until(driver -> lang.equals(localStorage().getItem("zds-lang")));
        return this;
    }

    @Step("Verify light theme is {light}")
    public LoginPage shouldHaveThemeLight(boolean light) {
        if (light) {
            html.shouldHave(cssClass("theme-light"));
            Wait().until(driver -> "light".equals(localStorage().getItem("zds-theme")));
        } else {
            html.shouldNotHave(cssClass("theme-light"));
            Wait().until(driver -> !"light".equals(localStorage().getItem("zds-theme")));
        }
        return this;
    }

}
