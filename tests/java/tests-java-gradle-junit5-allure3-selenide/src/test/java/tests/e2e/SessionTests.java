package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Authentication")
@Feature("Session")
@DisplayName("Session")
class SessionTests extends TestBase {

    @Test
    @Tag("smoke")
    @Tag("negative")
    @DisplayName("Invalid token clears session and hides welcome")
    void invalidTokenClearsSession() {
        homePage.openPageWithInvalidToken()
                .shouldShowLayout()
                .shouldHideWelcomePanel()
                .shouldClearAuthToken();
    }
}
