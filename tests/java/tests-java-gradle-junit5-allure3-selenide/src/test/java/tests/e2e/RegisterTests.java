package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.RegisterPage;

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@DisplayName("Register")
class RegisterTests extends TestBase {

    private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
    private static final String PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters";
    private static final String DUPLICATE_USERNAME_MESSAGE = "Username already taken";

    private final RegisterPage registerPage = new RegisterPage();

    @Test
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    void shouldRegisterNewUser() {
        String username = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        registerPage.openPage()
                .fillAndSubmitForm(username, "password123", "password123")
                .shouldHaveWelcomeMessage("Welcome, " + username + "!");
    }

    @Test
    @Tag("smoke")
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
    @Tag("smoke")
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
    @Tag("smoke")
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
