package tests.e2e;

import annotations.Layer;
import helpers.AuthSetup;
import helpers.DataFaker;
import helpers.User;
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
@Feature("Login")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Login")
class LoginTests extends TestBase {

    private static final String LOGIN_REQUIRED_MESSAGE =
            "Login is required (minimum 3 characters)";
    private static final String LOGIN_MIN_LENGTH_MESSAGE =
            "Login must be at least 3 characters";
    private static final String PASSWORD_REQUIRED_MESSAGE =
            "Password is required (minimum 6 characters)";
    private static final String PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters";
    private static final String BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)";
    private static final String WRONG_CREDENTIALS_MESSAGE = "Wrong login or password";

    private User minLengthUser;

    @AfterEach
    void cleanupMinLengthUser() {
        if (minLengthUser != null) {
            AuthSetup.deleteAccountQuietly(minLengthUser.username(), minLengthUser.password());
            minLengthUser = null;
        }
    }

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

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User is logged in with 3-character login and 6-character password")
    void shouldLoginWithMinimumLengthCredentials() {
        minLengthUser = new User(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength());
        AuthSetup.register(minLengthUser.username(), minLengthUser.password());
        loginScreen.shouldBeOpen()
                .fillAndSubmitForm(minLengthUser.username(), minLengthUser.password())
                .shouldHaveWelcomeMessage(minLengthUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        loginScreen.shouldBeOpen()
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        loginScreen.shouldBeOpen()
                .typeUsername("user1")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Wrong password shows readable error")
    void shouldShowErrorWhenPasswordIsWrong() {
        loginScreen.shouldBeOpen()
                .typeUsername("user1")
                .typePassword("wrongpassword")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsTooShort() {
        loginScreen.shouldBeOpen()
                .typeUsername("ab")
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsTooShort() {
        loginScreen.shouldBeOpen()
                .typeUsername("user1")
                .typePassword("123")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Unknown username shows readable error")
    void shouldShowErrorWhenUsernameIsUnknown() {
        loginScreen.shouldBeOpen()
                .typeUsername("nouser")
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    void shouldShowValidationErrorWhenCredentialsAreEmpty() {
        loginScreen.shouldBeOpen()
                .submitExpectingError()
                .shouldHaveErrorMessage(BOTH_REQUIRED_MESSAGE);
    }
}
