package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import helpers.ViewportHelper;
import io.qameta.allure.Step;

public class HeaderPage {

    private final Page page;
    public final Locator root;
    public final Locator burger;
    public final Locator menu;
    public final Locator langToggle;
    public final Locator langLabel;
    public final Locator themeToggle;
    public final Locator html;

    public HeaderPage(Page page) {
        this.page = page;
        this.root = page.getByTestId("header");
        this.burger = page.getByTestId("header-burger");
        this.menu = page.getByTestId("header-menu");
        var tools = page.getByTestId("header-tools");
        this.langToggle = tools.getByTestId("header-lang-toggle");
        this.langLabel = tools.getByTestId("header-lang-label");
        this.themeToggle = tools.getByTestId("header-theme-toggle");
        this.html = page.locator("html");
    }

    public Locator activeNav(String testid) {
        return page.getByTestId(testid);
    }

    public Locator currentPageLinks() {
        return page.locator("[data-testid='header-nav'] a[aria-current='page']");
    }

    public Locator menuNav(String testid) {
        return page.getByTestId(testid);
    }

    @Step("Click header nav {testid}")
    public HeaderPage clickNav(String testid) {
        activeNav(testid).click();
        return this;
    }

    @Step("Emulate mobile viewport (375x812)")
    public HeaderPage setMobileViewport() {
        ViewportHelper.setViewport(375, 812);
        return this;
    }

    @Step("Reset viewport to default")
    public HeaderPage resetViewport() {
        ViewportHelper.resetViewport();
        return this;
    }

    @Step("Open the burger menu")
    public HeaderPage openMenu() {
        burger.click();
        menu.waitFor();
        return this;
    }

    @Step("Click menu nav link {testid}")
    public HeaderPage clickMenuNav(String testid) {
        menuNav(testid).click();
        return this;
    }

    @Step("Wait until the burger menu is closed")
    public HeaderPage shouldHaveClosedMenu() {
        menu.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.HIDDEN));
        return this;
    }

    @Step("Click language toggle")
    public HeaderPage clickLangToggle() {
        langToggle.click();
        return this;
    }

    @Step("Click theme toggle")
    public HeaderPage clickThemeToggle() {
        themeToggle.click();
        return this;
    }
}
