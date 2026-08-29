package pages.components;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.cssClass;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

public class HeaderComponent {

    private final SelenideElement root = $("[data-testid='header']");
    private final SelenideElement langToggle =
            $("[data-testid='header-tools'] [data-testid='header-lang-toggle']");
    private final SelenideElement langLabel =
            $("[data-testid='header-tools'] [data-testid='header-lang-label']");
    private final SelenideElement themeToggle =
            $("[data-testid='header-tools'] [data-testid='header-theme-toggle']");
    private final SelenideElement html = $("html");

    @Step("Verify embedded header is mounted")
    public HeaderComponent shouldShowEmbeddedHeader() {
        root.shouldBe(visible);
        return this;
    }

    @Step("Click language toggle")
    public HeaderComponent clickLangToggle() {
        langToggle.shouldBe(visible).click();
        return this;
    }

    @Step("Click theme toggle")
    public HeaderComponent clickThemeToggle() {
        themeToggle.shouldBe(visible).click();
        return this;
    }

    @Step("Verify language label: {label}")
    public HeaderComponent shouldHaveLangLabel(String label) {
        langLabel.shouldHave(text(label));
        return this;
    }

    @Step("Verify html lang: {lang}")
    public HeaderComponent shouldHaveHtmlLang(String lang) {
        html.shouldHave(attribute("lang", lang));
        return this;
    }

    @Step("Verify theme: {theme}")
    public HeaderComponent shouldHaveTheme(String theme) {
        if ("light".equals(theme)) {
            html.shouldHave(cssClass("theme-light"));
        } else {
            html.shouldNotHave(cssClass("theme-light"));
        }
        return this;
    }
}
