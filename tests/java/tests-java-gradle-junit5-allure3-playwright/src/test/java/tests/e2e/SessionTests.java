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
import static org.junit.jupiter.api.Assertions.assertNull;

@Layer("e2e")
@Epic("Authentication")
@Feature("Session")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Session")
class SessionTests extends TestBase {

    @Test
    @Tag("e2e")
    @DisplayName("Invalid token clears session and hides welcome")
    void invalidTokenClearsSession() {
        app.home.openWithInvalidToken();
        assertThat(app.home.welcomePanel).hasAttribute("hidden", "");
        assertNull(app.home.authToken());
    }

    @Test
    @Tag("e2e")
    @DisplayName("Session survives a page reload (token in localStorage)")
    void sessionSurvivesReload() {
        app.login.open().login("user1", "password1");
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!");
        app.home.reload();
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!");
    }
}
