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

@Layer("e2e")
@Epic("Authentication")
@Feature("Login")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Login")
class LoginTests extends TestBase {

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        loginScreen.shouldBeOpen()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");
    }
}
