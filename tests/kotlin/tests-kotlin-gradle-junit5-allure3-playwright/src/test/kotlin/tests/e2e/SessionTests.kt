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
@Feature("Session")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Session")
class SessionTests : TestBase() {

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Invalid token clears session and hides welcome")
    fun invalidTokenClearsSession() {
        app.home.openWithInvalidToken()
            .shouldHideWelcomePanel()
            .shouldClearAuthToken()
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("Session survives a page reload (token in localStorage)")
    fun sessionSurvivesReload() {
        app.home.openWithLocalStorageAuthentication("user1", "password1")
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!")
        app.home.reload()
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!")
    }
}
