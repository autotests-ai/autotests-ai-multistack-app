package pages.components;

import helpers.Ui;
import helpers.ViewportHelper;
import io.qameta.allure.Step;
import org.openqa.selenium.By;

public class HeaderComponent {

    @Step("Emulate mobile viewport (375x812)")
    public HeaderComponent setMobileViewport() {
        ViewportHelper.setViewport(375, 812);
        return this;
    }

    @Step("Reset viewport to default")
    public HeaderComponent resetViewport() {
        ViewportHelper.resetViewport();
        return this;
    }

    @Step("Desktop nav '{navTestid}' is the active item")
    public HeaderComponent shouldHaveActiveNav(String navTestid) {
        var locator = Ui.testId(navTestid);
        Ui.shouldBeVisible(locator);
        Ui.shouldHaveCssClass(locator, "is-active");
        Ui.shouldHaveAttribute(locator, "aria-current", "page");
        Ui.waitUntil(driver ->
                Ui.all(By.cssSelector("[data-testid='header-nav'] a[aria-current='page']")).size() == 1);
        return this;
    }

    @Step("Click header nav '{navTestid}'")
    public HeaderComponent clickNav(String navTestid) {
        Ui.click(navTestid);
        return this;
    }

    @Step("Open the burger menu")
    public HeaderComponent openMenu() {
        Ui.click("header-burger");
        Ui.shouldBeVisible("header-menu");
        Ui.shouldHaveAttribute(Ui.testId("header-burger"), "aria-expanded", "true");
        return this;
    }

    @Step("Menu nav '{menuNavTestid}' is the active item")
    public HeaderComponent shouldHaveActiveMenuNav(String menuNavTestid) {
        var locator = Ui.testId(menuNavTestid);
        Ui.shouldBeVisible(locator);
        Ui.shouldHaveCssClass(locator, "is-active");
        Ui.shouldHaveAttribute(locator, "aria-current", "page");
        return this;
    }

    @Step("Click menu nav link '{menuNavTestid}'")
    public HeaderComponent clickMenuNav(String menuNavTestid) {
        Ui.click(menuNavTestid);
        return this;
    }

    @Step("Menu is closed")
    public HeaderComponent shouldHaveClosedMenu() {
        Ui.shouldBeHidden(Ui.testId("header-menu"));
        Ui.shouldHaveAttribute(Ui.testId("header-burger"), "aria-expanded", "false");
        return this;
    }

    @Step("Verify embedded header is mounted")
    public HeaderComponent shouldShowEmbeddedHeader() {
        Ui.shouldBeVisible("header");
        return this;
    }

    @Step("Click language toggle")
    public HeaderComponent clickLangToggle() {
        Ui.click(By.cssSelector("[data-testid='header-tools'] [data-testid='header-lang-toggle']"));
        return this;
    }

    @Step("Click theme toggle")
    public HeaderComponent clickThemeToggle() {
        Ui.click(By.cssSelector("[data-testid='header-tools'] [data-testid='header-theme-toggle']"));
        return this;
    }

    @Step("Verify language label: {label}")
    public HeaderComponent shouldHaveLangLabel(String label) {
        Ui.shouldHaveText(By.cssSelector("[data-testid='header-tools'] [data-testid='header-lang-label']"), label);
        return this;
    }

    @Step("Verify html lang: {lang}")
    public HeaderComponent shouldHaveHtmlLang(String lang) {
        Ui.shouldHaveAttribute(By.cssSelector("html"), "lang", lang);
        return this;
    }

    @Step("Verify theme: {theme}")
    public HeaderComponent shouldHaveTheme(String theme) {
        var html = By.cssSelector("html");
        if ("light".equals(theme)) {
            Ui.shouldHaveCssClass(html, "theme-light");
        } else {
            Ui.shouldNotHaveCssClass(html, "theme-light");
        }
        return this;
    }
}
