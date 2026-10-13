package tests.e2e.mobile;

import tests.MobileTestBase;
import annotations.Layer;
import api.AuthApiClient;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import testdata.User;
import testdata.UserBuilder;

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Register")
class RegisterTests extends MobileTestBase {

    private static final String LOGIN_REQUIRED_MESSAGE =
            "Login is required (minimum 3 characters)";
    private static final String LOGIN_MIN_LENGTH_MESSAGE =
            "Login must be at least 3 characters";
    private static final String PASSWORD_REQUIRED_MESSAGE =
            "Password is required (minimum 6 characters)";
    private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
    private static final String PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters";
    private static final String BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)";
    private static final String DUPLICATE_USERNAME_MESSAGE = "Username already taken";

    private static final String REGISTER_PASSWORD = "password123";

    /** Throwaways registered through the UI; the API postcondition deletes them (401 = never created). */
    private final User registeredUser = new UserBuilder().withUsername().withPassword().build();
    private final User minLengthUser = new UserBuilder().withMinLengthCredentials().build();

    @AfterEach
    void deleteRegisteredUsers() {
        AuthApiClient.deleteAccountQuietly(registeredUser.username(), registeredUser.password());
        AuthApiClient.deleteAccountQuietly(minLengthUser.username(), minLengthUser.password());
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .fillAndSubmitForm(
                        registeredUser.username(),
                        registeredUser.password(),
                        registeredUser.password())
                .shouldHaveWelcomeMessage(registeredUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register with 3-character login and 6-character password")
    void shouldRegisterWithMinimumLengthCredentials() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .fillAndSubmitForm(
                        minLengthUser.username(),
                        minLengthUser.password(),
                        minLengthUser.password())
                .shouldHaveWelcomeMessage(minLengthUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Password mismatch shows validation error")
    void shouldShowErrorWhenPasswordsDoNotMatch() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
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
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
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
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .typeUsername("user1")
                .typePassword(REGISTER_PASSWORD)
                .typeConfirmPassword(REGISTER_PASSWORD)
                .submitExpectingError()
                .shouldHaveErrorMessage(DUPLICATE_USERNAME_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsTooShort() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .typeUsername("ab")
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .typeUsername("newuser")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    void shouldShowValidationErrorWhenCredentialsAreEmpty() {
        loginScreen.shouldBeOpen()
                .clickRegisterLink()
                .shouldBeOpen()
                .submitExpectingError()
                .shouldHaveErrorMessage(BOTH_REQUIRED_MESSAGE);
    }
}
