package tests.ui

import annotations.Layer
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import tests.TestBase

@Layer("ui")
@Epic("Header")
@Feature("Burger menu")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Burger menu")
class BurgerMenuTests : TestBase() {

    @BeforeEach
    fun setMobileViewport() {
        app.header.setMobileViewport()
    }

    @AfterEach
    fun resetViewport() {
        app.header.resetViewport()
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu nav marks Login active on the login page")
    fun menuNavMarksActiveLogin() {
        app.login.open()
        app.header.openMenu()
        app.header.shouldHaveActiveMenuNav("header-menu-nav-login")
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu Register opens the register page and closes the menu")
    fun clickingRegisterOpensRegisterAndClosesMenu() {
        app.login.open()
        app.header.openMenu()
        app.header.shouldHaveActiveMenuNav("header-menu-nav-login")
        app.header.clickMenuNav("header-menu-nav-register")
        app.register.shouldBeOpen()
        app.header.shouldHaveClosedMenu()
        assertThat(app.header.burger).hasAttribute("aria-expanded", "false")
    }

    @Test
    @Tag("ui")
    @DisplayName("Menu Login opens the login page and closes the menu")
    fun clickingLoginOpensLoginAndClosesMenu() {
        app.register.open()
        app.header.openMenu()
        app.header.clickMenuNav("header-menu-nav-login")
        app.login.shouldBeOpen()
        app.header.shouldHaveClosedMenu()
        assertThat(app.header.burger).hasAttribute("aria-expanded", "false")
    }
}
