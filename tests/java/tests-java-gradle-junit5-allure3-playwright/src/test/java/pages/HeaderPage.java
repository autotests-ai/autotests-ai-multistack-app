package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import io.qameta.allure.Step;

public class HeaderPage {

    private final Page page;
    public final Locator root;

    public HeaderPage(Page page) {
        this.page = page;
        this.root = page.getByTestId("header");
    }

    public Locator activeNav(String testid) {
        return page.getByTestId(testid);
    }

    public Locator currentPageLinks() {
        return page.locator("[data-testid='header-nav'] a[aria-current='page']");
    }

    @Step("Click header nav {testid}")
    public HeaderPage clickNav(String testid) {
        activeNav(testid).click();
        return this;
    }
}
