package tests.e2e;

import annotations.Layer;
import helpers.AuthSetup;
import helpers.DataFaker;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

@Layer("e2e")
@Epic("Authentication")
@Feature("Delete account")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Delete account")
class DeleteAccountTests extends TestBase {

    private static final String PASSWORD = "password123";

    /** Throwaway — never seeded user1. Deleted through the API if the UI did not. */
    private String throwawayUsername;

    @AfterEach
    void cleanupThrowawayUser() {
        if (throwawayUsername != null) {
            AuthSetup.deleteAccountQuietly(throwawayUsername, PASSWORD);
            throwawayUsername = null;
        }
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("Confirming delete account clears the session and navigates to login")
    void confirmingDeleteClearsSessionAndNavigatesToLogin() {
        throwawayUsername = DataFaker.username();
        AuthSetup.register(throwawayUsername, PASSWORD);

        loginScreen.shouldBeOpen()
                .fillAndSubmitForm(throwawayUsername, PASSWORD)
                .shouldHaveWelcomeMessage("Welcome, " + throwawayUsername + "!")
                .shouldShowSessionActions()
                .clickDeleteAccountAndConfirm()
                .shouldHaveFormTitle("Login Form");

        throwawayUsername = null;
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("Cancelling the confirm keeps the session")
    void cancellingConfirmKeepsSession() {
        throwawayUsername = DataFaker.username();
        AuthSetup.register(throwawayUsername, PASSWORD);

        loginScreen.shouldBeOpen()
                .fillAndSubmitForm(throwawayUsername, PASSWORD)
                .shouldHaveWelcomeMessage("Welcome, " + throwawayUsername + "!")
                .clickDeleteAccountAndCancel()
                .shouldHaveWelcomeMessage("Welcome, " + throwawayUsername + "!");

        AuthSetup.login(throwawayUsername, PASSWORD);
    }
}
