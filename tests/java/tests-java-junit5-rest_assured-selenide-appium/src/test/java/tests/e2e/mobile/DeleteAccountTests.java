package tests.e2e.mobile;

import tests.MobileTestBase;
import annotations.Layer;
import api.AuthApiClient;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import testdata.User;
import testdata.UserBuilder;

import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;

@Layer("e2e")
@Epic("Authentication")
@Feature("Delete account")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Delete account")
class DeleteAccountTests extends MobileTestBase {

    /** Throwaway — never seeded user1. Deleted through the API if the UI did not. */
    private final User registeredUser = new UserBuilder().withUsername().withPassword().build();

    @BeforeEach
    void registerUser() {
        AuthApiClient.register(registeredUser.username(), registeredUser.password());
    }

    @AfterEach
    void cleanupRegisteredUser() {
        AuthApiClient.deleteAccountQuietly(registeredUser.username(), registeredUser.password());
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("Confirming delete account clears the session and navigates to login")
    void confirmingDeleteClearsSessionAndNavigatesToLogin() {
        loginScreen.shouldBeOpen()
                .fillAndSubmitForm(registeredUser.username(), registeredUser.password())
                .shouldHaveWelcomeMessage(registeredUser.welcomeMessage())
                .shouldShowSessionActions()
                .clickDeleteAccountAndConfirm()
                .shouldHaveFormTitle("Login Form");

        AuthApiClient.loginResponse(registeredUser.username(), registeredUser.password())
                .then()
                .statusCode(401)
                .body("message", equalTo("Wrong login or password"));
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("Cancelling the confirm keeps the session")
    void cancellingConfirmKeepsSession() {
        loginScreen.shouldBeOpen()
                .fillAndSubmitForm(registeredUser.username(), registeredUser.password())
                .shouldHaveWelcomeMessage(registeredUser.welcomeMessage())
                .clickDeleteAccountAndCancel()
                .shouldHaveWelcomeMessage(registeredUser.welcomeMessage());

        AuthApiClient.loginResponse(registeredUser.username(), registeredUser.password())
                .then()
                .statusCode(200)
                .body("username", equalTo(registeredUser.username()))
                .body("token", not(emptyOrNullString()));
    }
}
