package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import helpers.User;
import helpers.UserBuilder;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Authentication")
@Feature("Logout")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Logout")
class LogoutTests extends TestBase {

    private static final User SEEDED_USER = new UserBuilder().withSeededUser().build();

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User can logout after form login")
    void shouldLogoutAfterFormLogin() {
        loginPage.openPage()
                .fillAndSubmitForm(SEEDED_USER.username(), SEEDED_USER.password())
                .shouldHaveWelcomeMessage(SEEDED_USER.welcomeMessage());

        homePage.clickLogoutButton()
                .shouldHaveFormTitle("Login Form");
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User can logout after localStorage authentication")
    void shouldLogoutAfterLocalStorageAuthentication() {
        homePage.openPageWithLocalStorageAuthentication(SEEDED_USER.username(), SEEDED_USER.password())
                .shouldHaveWelcomeMessage(SEEDED_USER.welcomeMessage())
                .shouldShowSessionActions();

        homePage.clickLogoutButton()
                .shouldHaveFormTitle("Login Form");
    }
}
