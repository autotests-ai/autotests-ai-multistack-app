package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import api.AuthApiClient;
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

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

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
            AuthApiClient.deleteAccountQuietly(minLengthUser.username(), minLengthUser.password());
            minLengthUser = null;
        }
    }

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        app.login.open().login("user1", "password1");
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!");
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User is logged in with 3-character login and 6-character password")
    void shouldLoginWithMinimumLengthCredentials() {
        minLengthUser = new User(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength());
        AuthApiClient.register(minLengthUser.username(), minLengthUser.password());
        app.login.open().login(minLengthUser.username(), minLengthUser.password());
        assertThat(app.home.welcomeMessage).containsText(minLengthUser.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        app.login.open()
                .typePassword("password1")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        app.login.open()
                .typeUsername("user1")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Wrong password shows readable error")
    void shouldShowErrorWhenPasswordIsWrong() {
        app.login.open()
                .typeUsername("user1")
                .typePassword("wrongpassword")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsTooShort() {
        app.login.open()
                .typeUsername("ab")
                .typePassword("password1")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(LOGIN_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsTooShort() {
        app.login.open()
                .typeUsername("user1")
                .typePassword("123")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Unknown username shows readable error")
    void shouldShowErrorWhenUsernameIsUnknown() {
        app.login.open()
                .typeUsername("nouser")
                .typePassword("password1")
                .submitExpectingError();
        assertThat(app.login.errorMessage).containsText(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    void shouldShowValidationErrorWhenCredentialsAreEmpty() {
        app.login.open().submitExpectingError();
        assertThat(app.login.errorMessage).containsText(BOTH_REQUIRED_MESSAGE);
    }
}
