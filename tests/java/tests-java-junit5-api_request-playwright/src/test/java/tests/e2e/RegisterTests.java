package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import api.AuthApiClient;
import helpers.User;
import helpers.UserBuilder;
import helpers.DataFaker;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Register")
class RegisterTests extends TestBase {

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

    /** Throwaway registered by the test — deleted through the API afterwards. */
    private User registeredUser;

    @AfterEach
    void cleanupRegisteredUser() {
        if (registeredUser != null) {
            AuthApiClient.deleteAccountQuietly(registeredUser.username(), registeredUser.password());
            registeredUser = null;
        }
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        registeredUser = new UserBuilder().withUsername().withPassword().build();
        app.register.open().signup(
                registeredUser.username(),
                registeredUser.password());
        assertThat(app.home.welcomeMessage).containsText(registeredUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register with 3-character login and 6-character password")
    void shouldRegisterWithMinimumLengthCredentials() {
        registeredUser = new User(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength());
        app.register.open().signup(
                registeredUser.username(),
                registeredUser.password());
        assertThat(app.home.welcomeMessage).containsText(registeredUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Password mismatch shows validation error")
    void shouldShowErrorWhenPasswordsDoNotMatch() {
        app.register.open()
                .typeUsername("newuser")
                .typePassword("password123")
                .typeConfirmPassword("password124")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(PASSWORD_MISMATCH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    void shouldShowErrorWhenPasswordIsTooShort() {
        app.register.open()
                .typeUsername("newuser")
                .typePassword("abc")
                .typeConfirmPassword("abc")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Duplicate username shows readable error")
    void shouldShowErrorWhenUsernameIsTaken() {
        app.register.open()
                .typeUsername("user1")
                .typePassword(REGISTER_PASSWORD)
                .typeConfirmPassword(REGISTER_PASSWORD)
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(DUPLICATE_USERNAME_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsTooShort() {
        app.register.open()
                .typeUsername("ab")
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(LOGIN_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        app.register.open()
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        app.register.open()
                .typeUsername("newuser")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    void shouldShowValidationErrorWhenCredentialsAreEmpty() {
        app.register.open().submitExpectingError();
        assertThat(app.register.errorMessage).containsText(BOTH_REQUIRED_MESSAGE);
    }
}
