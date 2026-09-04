package tests.e2e

import annotations.Layer
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import tests.TestBase

@Layer("e2e")
@Epic("Authentication")
@Feature("Logout")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Logout")
class LogoutTests : TestBase() {

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User can logout after form login")
    fun shouldLogoutAfterFormLogin() {
        app.login.open().login("user1", "password1")
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!")
        app.home.logout()
        assertThat(app.login.formTitle).containsText("Login Form")
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User can logout after localStorage authentication")
    fun shouldLogoutAfterLocalStorageAuthentication() {
        app.home.openWithLocalStorageAuthentication("user1", "password1")
            .shouldShowSessionActions()
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!")
        app.home.logout()
        assertThat(app.login.formTitle).containsText("Login Form")
    }
}
