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

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("e2e")
@Epic("Authentication")
@Feature("Logout")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Logout")
class LogoutTests extends TestBase {

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @DisplayName("User can log out after login")
    void shouldLogoutAfterLogin() {
        app.login.open().login("user1", "password1");
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!");
        app.home.logout();
        assertThat(app.login.formTitle).containsText("Login Form");
    }
}
