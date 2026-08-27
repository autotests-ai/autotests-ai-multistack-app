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
@Feature("Login")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Login")
class LoginTests extends TestBase {

    private static final User SEEDED_USER = new UserBuilder().withSeededUser().build();

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

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        loginPage.openPage()
                .fillAndSubmitForm(SEEDED_USER.username(), SEEDED_USER.password())
                .shouldHaveWelcomeMessage(SEEDED_USER.welcomeMessage());
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsEmpty() {
        loginPage.openPage()
                .typePassword(SEEDED_USER.password())
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsEmpty() {
        loginPage.openPage()
                .typeUsername(SEEDED_USER.username())
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Wrong password shows readable error")
    void shouldShowErrorWhenPasswordIsWrong() {
        loginPage.openPage()
                .typeUsername(SEEDED_USER.username())
                .typePassword("wrongpassword")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    void shouldShowValidationErrorWhenUsernameIsTooShort() {
        loginPage.openPage()
                .typeUsername("ab")
                .typePassword(SEEDED_USER.password())
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    void shouldShowValidationErrorWhenPasswordIsTooShort() {
        loginPage.openPage()
                .typeUsername(SEEDED_USER.username())
                .typePassword("123")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MIN_LENGTH_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Unknown username shows readable error")
    void shouldShowErrorWhenUsernameIsUnknown() {
        loginPage.openPage()
                .typeUsername("nouser")
                .typePassword(SEEDED_USER.password())
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE);
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    void shouldShowValidationErrorWhenCredentialsAreEmpty() {
        loginPage.openPage()
                .submitExpectingError()
                .shouldHaveErrorMessage(BOTH_REQUIRED_MESSAGE);
    }
}
