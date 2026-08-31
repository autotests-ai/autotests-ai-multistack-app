package tests.ui;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("ui")
@Epic("Header")
@Feature("Burger menu")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Burger menu")
class BurgerMenuTests extends TestBase {

    private static final Pattern IS_ACTIVE = Pattern.compile("is-active");

    @BeforeEach
    void setMobileViewport() {
        app.header.setMobileViewport();
    }

    @AfterEach
    void resetViewport() {
        app.header.resetViewport();
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu nav marks Login active on the login page")
    void menuNavMarksActiveLogin() {
        app.login.open();
        app.header.openMenu();
        assertThat(app.header.menuNav("header-menu-nav-login")).hasClass(IS_ACTIVE);
        assertThat(app.header.menuNav("header-menu-nav-login")).hasAttribute("aria-current", "page");
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu Register opens the register page and closes the menu")
    void clickingRegisterOpensRegisterAndClosesMenu() {
        app.login.open();
        app.header.openMenu();
        assertThat(app.header.menuNav("header-menu-nav-login")).hasClass(IS_ACTIVE);
        app.header.clickMenuNav("header-menu-nav-register");
        app.register.shouldBeOpen();
        app.header.shouldHaveClosedMenu();
        assertThat(app.header.burger).hasAttribute("aria-expanded", "false");
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu Login opens the login page and closes the menu")
    void clickingLoginOpensLoginAndClosesMenu() {
        app.register.open();
        app.header.openMenu();
        app.header.clickMenuNav("header-menu-nav-login");
        app.login.shouldBeOpen();
        app.header.shouldHaveClosedMenu();
        assertThat(app.header.burger).hasAttribute("aria-expanded", "false");
    }
}
