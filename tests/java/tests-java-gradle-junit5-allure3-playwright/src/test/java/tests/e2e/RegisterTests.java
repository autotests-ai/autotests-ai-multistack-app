package tests.e2e;

import annotations.Layer;
import helpers.User;
import helpers.UserBuilder;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

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
    private static final String PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters";
    private static final String BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)";
    private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
    private static final String DUPLICATE_USERNAME_MESSAGE = "Username already taken";
    private static final String REGISTER_PASSWORD = "password123";

    private User registeredUser;

    @AfterEach
    void cleanupRegisteredUser() {
        if (registeredUser == null) {
            return;
        }
        try {
            app.home.clickDeleteAccountAndConfirm();
        } catch (RuntimeException ignored) {
            // Cleanup must not mask the original test failure.
        }
        registeredUser = null;
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        registeredUser = new UserBuilder().withUsername().withPassword().build();
        app.register.open().signup(registeredUser.username(), registeredUser.password());
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
    @DisplayName("Short password on register shows validation error")
    void shouldShowErrorWhenPasswordIsShort() {
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
    @DisplayName("Taken username on register shows readable error")
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
    @DisplayName("Short username on register shows validation error")
    void shouldShowErrorWhenUsernameIsShort() {
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
    @DisplayName("Empty username on register shows validation error")
    void shouldShowErrorWhenUsernameIsEmpty() {
        app.register.open()
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError();
        assertThat(app.register.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password on register shows validation error")
    void shouldShowErrorWhenPasswordIsEmpty() {
        app.register.open().typeUsername("newuser").submitExpectingError();
        assertThat(app.register.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password on register show combined validation error")
    void shouldShowErrorWhenBothAreEmpty() {
        app.register.open().submitExpectingError();
        assertThat(app.register.errorMessage).containsText(BOTH_REQUIRED_MESSAGE);
    }
}
