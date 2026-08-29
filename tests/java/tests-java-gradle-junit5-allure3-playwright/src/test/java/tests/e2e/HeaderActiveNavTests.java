package tests.e2e;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("e2e")
@Epic("Header")
@Feature("Active nav")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Header active nav")
class HeaderActiveNavTests extends TestBase {

    private static final Pattern IS_ACTIVE = Pattern.compile("is-active");

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @DisplayName("Login page marks Login as the active header nav")
    void loginPageMarksActiveLogin() {
        app.login.open();
        assertThat(app.header.activeNav("header-nav-login")).hasClass(IS_ACTIVE);
        assertThat(app.header.activeNav("header-nav-login")).hasAttribute("aria-current", "page");
        assertThat(app.header.currentPageLinks()).hasCount(1);
    }

    @Test
    @Tag("e2e")
    @DisplayName("Register page marks Register as the active header nav")
    void registerPageMarksActiveRegister() {
        app.register.open();
        assertThat(app.header.activeNav("header-nav-register")).hasClass(IS_ACTIVE);
        assertThat(app.header.activeNav("header-nav-register")).hasAttribute("aria-current", "page");
    }

    @Test
    @Tag("e2e")
    @DisplayName("In-form Register link syncs the active header nav")
    void inFormRegisterLinkSyncsActiveNav() {
        app.login.open();
        assertThat(app.header.activeNav("header-nav-login")).hasClass(IS_ACTIVE);
        app.login.clickRegisterLink();
        app.register.shouldBeOpen();
        assertThat(app.header.activeNav("header-nav-register")).hasClass(IS_ACTIVE);
    }

    @Test
    @Tag("e2e")
    @DisplayName("In-form Login link syncs the active header nav")
    void inFormLoginLinkSyncsActiveNav() {
        app.register.open();
        assertThat(app.header.activeNav("header-nav-register")).hasClass(IS_ACTIVE);
        app.register.clickLoginLink();
        app.login.shouldBeOpen();
        assertThat(app.header.activeNav("header-nav-login")).hasClass(IS_ACTIVE);
    }

    @Test
    @Tag("e2e")
    @DisplayName("Register link on login opens the register form")
    void registerLinkOnLoginOpensRegisterForm() {
        app.login.open();
        app.login.clickRegisterLink();
        app.register.shouldBeOpen();
        assertThat(app.register.formTitle).containsText("Register");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Login link on register opens the login form")
    void loginLinkOnRegisterOpensLoginForm() {
        app.register.open();
        app.register.clickLoginLink();
        app.login.shouldBeOpen();
        assertThat(app.login.formTitle).containsText("Login Form");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Header on login shows Login")
    void headerOnLoginShowsLogin() {
        app.login.open();
        assertThat(app.header.activeNav("header-nav-login")).containsText("Login");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Header on register shows Register")
    void headerOnRegisterShowsRegister() {
        app.register.open();
        assertThat(app.header.activeNav("header-nav-register")).containsText("Register");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Header Register nav opens the register form")
    void headerRegisterNavOpensRegisterForm() {
        app.login.open();
        app.header.clickNav("header-nav-register");
        app.register.shouldBeOpen();
        assertThat(app.register.formTitle).containsText("Register");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Header Login nav opens the login form")
    void headerLoginNavOpensLoginForm() {
        app.register.open();
        app.header.clickNav("header-nav-login");
        app.login.shouldBeOpen();
        assertThat(app.login.formTitle).containsText("Login Form");
    }
}
