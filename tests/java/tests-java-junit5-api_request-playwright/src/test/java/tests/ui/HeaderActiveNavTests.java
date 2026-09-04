package tests.ui;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

@Layer("ui")
@Epic("Header")
@Feature("Active nav")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Header active nav")
class HeaderActiveNavTests extends TestBase {

    @Test
    @Tag("ui")
    @Tag("smoke")
    @DisplayName("Login page marks Login as the active header nav")
    void loginPageMarksActiveLogin() {
        app.login.open();
        app.header.shouldHaveActiveNav("header-nav-login");
    }

    @Test
    @Tag("ui")
    @DisplayName("Register page marks Register as the active header nav")
    void registerPageMarksActiveRegister() {
        app.register.open();
        app.header.shouldHaveActiveNav("header-nav-register");
    }

    @Test
    @Tag("ui")
    @DisplayName("Home page marks Home as the active header nav")
    void homePageMarksActiveHome() {
        app.home.open();
        app.header.shouldHaveActiveNav("header-nav-home");
    }

    @Test
    @Tag("ui")
    @DisplayName("In-form Register link syncs the active header nav")
    void inFormRegisterLinkSyncsActiveNav() {
        app.login.open();
        app.header.shouldHaveActiveNav("header-nav-login");
        app.login.clickRegisterLink();
        app.register.shouldBeOpen();
        app.header.shouldHaveActiveNav("header-nav-register");
    }

    @Test
    @Tag("ui")
    @DisplayName("In-form Login link syncs the active header nav")
    void inFormLoginLinkSyncsActiveNav() {
        app.register.open();
        app.header.shouldHaveActiveNav("header-nav-register");
        app.register.clickLoginLink();
        app.login.shouldBeOpen();
        app.header.shouldHaveActiveNav("header-nav-login");
    }

    @Test
    @Tag("ui")
    @DisplayName("Header nav Register opens register and marks it active")
    void headerNavRegisterOpensRegister() {
        app.login.open();
        app.header.clickNav("header-nav-register");
        app.register.shouldBeOpen();
        app.header.shouldHaveActiveNav("header-nav-register");
    }

    @Test
    @Tag("ui")
    @DisplayName("Header nav Login opens login and marks it active")
    void headerNavLoginOpensLogin() {
        app.register.open();
        app.header.clickNav("header-nav-login");
        app.login.shouldBeOpen();
        app.header.shouldHaveActiveNav("header-nav-login");
    }
}
