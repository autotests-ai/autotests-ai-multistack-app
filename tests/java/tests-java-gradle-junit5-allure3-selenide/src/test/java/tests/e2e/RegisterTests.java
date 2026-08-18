package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import api.AuthApiClient;
import helpers.DataFaker;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.RegisterPage;

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Register")
class RegisterTests extends TestBase {

    private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
    private static final String PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters";
    private static final String DUPLICATE_USERNAME_MESSAGE = "Username already taken";

    private static final String REGISTER_PASSWORD = "password123";

    private final RegisterPage registerPage = new RegisterPage();

    /** Username registered by the test — deleted through the API afterwards. */
    private String registeredUsername;

    @AfterEach
    void cleanupRegisteredUser() {
        if (registeredUsername != null) {
            AuthApiClient.deleteAccountQuietly(registeredUsername, REGISTER_PASSWORD);
            registeredUsername = null;
        }
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        registeredUsername = DataFaker.username();

        registerPage.openPage()
                .fillAndSubmitForm(registeredUsername, REGISTER_PASSWORD, REGISTER_PASSWORD)
                .shouldHaveWelcomeMessage("Welcome, " + registeredUsername + "!");
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Password mismatch shows validation error")
    void shouldShowErrorWhenPasswordsDoNotMatch() {
        registerPage.openPage()
                .typeUsername("newuser")
                .typePassword("password123")
                .typeConfirmPassword("password124")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MISMATCH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    void shouldShowErrorWhenPasswordIsTooShort() {
        registerPage.openPage()
                .typeUsername("newuser")
                .typePassword("abc")
                .typeConfirmPassword("abc")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Duplicate username shows readable error")
    void shouldShowErrorWhenUsernameIsTaken() {
        registerPage.openPage()
                .typeUsername("user1")
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError()
                .shouldHaveErrorMessage(DUPLICATE_USERNAME_MESSAGE);
    }
}
