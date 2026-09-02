package tests.e2e

import annotations.Layer
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import helpers.User
import helpers.UserBuilder
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import tests.TestBase

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Register")
class RegisterTests : TestBase() {

    private var registeredUser: User? = null

    @AfterEach
    fun cleanupRegisteredUser() {
        if (registeredUser == null) {
            return
        }
        try {
            app.home.clickDeleteAccountAndConfirm()
        } catch (_: RuntimeException) {
            // Cleanup must not mask the original test failure.
        }
        registeredUser = null
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    fun shouldRegisterNewUser() {
        registeredUser = UserBuilder().withUsername().withPassword().build()
        val user = registeredUser!!
        app.register.open().signup(user.username(), user.password())
        assertThat(app.home.welcomeMessage).containsText(user.welcomeMessage())
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Password mismatch shows validation error")
    fun shouldShowErrorWhenPasswordsDoNotMatch() {
        app.register.open()
            .typeUsername("newuser")
            .typePassword("password123")
            .typeConfirmPassword("password124")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(PASSWORD_MISMATCH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password on register shows validation error")
    fun shouldShowErrorWhenPasswordIsShort() {
        app.register.open()
            .typeUsername("newuser")
            .typePassword("abc")
            .typeConfirmPassword("abc")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(PASSWORD_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Taken username on register shows readable error")
    fun shouldShowErrorWhenUsernameIsTaken() {
        app.register.open()
            .typeUsername("user1")
            .typePassword(REGISTER_PASSWORD)
            .typeConfirmPassword(REGISTER_PASSWORD)
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(DUPLICATE_USERNAME_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username on register shows validation error")
    fun shouldShowErrorWhenUsernameIsShort() {
        app.register.open()
            .typeUsername("ab")
            .typePassword("password123")
            .typeConfirmPassword("password123")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(LOGIN_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username on register shows validation error")
    fun shouldShowErrorWhenUsernameIsEmpty() {
        app.register.open()
            .typePassword("password123")
            .typeConfirmPassword("password123")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password on register shows validation error")
    fun shouldShowErrorWhenPasswordIsEmpty() {
        app.register.open().typeUsername("newuser").submitExpectingError()
        assertThat(app.register.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password on register show combined validation error")
    fun shouldShowErrorWhenBothAreEmpty() {
        app.register.open().submitExpectingError()
        assertThat(app.register.errorMessage).containsText(BOTH_REQUIRED_MESSAGE)
    }

    companion object {
        private const val LOGIN_REQUIRED_MESSAGE =
            "Login is required (minimum 3 characters)"
        private const val LOGIN_MIN_LENGTH_MESSAGE =
            "Login must be at least 3 characters"
        private const val PASSWORD_REQUIRED_MESSAGE =
            "Password is required (minimum 6 characters)"
        private const val PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters"
        private const val BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)"
        private const val PASSWORD_MISMATCH_MESSAGE = "Passwords do not match"
        private const val DUPLICATE_USERNAME_MESSAGE = "Username already taken"
        private const val REGISTER_PASSWORD = "password123"
    }
}
