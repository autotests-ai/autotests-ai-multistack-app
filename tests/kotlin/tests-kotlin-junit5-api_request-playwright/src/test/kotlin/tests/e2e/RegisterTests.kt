package tests.e2e

import tests.TestBase
import annotations.Layer
import api.AuthApiClient
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import helpers.User
import helpers.UserBuilder
import helpers.DataFaker
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

@Layer("e2e")
@Epic("Authentication")
@Feature("Register")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Register")
class RegisterTests : TestBase() {

    private val LOGIN_REQUIRED_MESSAGE =
            "Login is required (minimum 3 characters)"
    private val LOGIN_MIN_LENGTH_MESSAGE =
            "Login must be at least 3 characters"
    private val PASSWORD_REQUIRED_MESSAGE =
            "Password is required (minimum 6 characters)"
    private val PASSWORD_MISMATCH_MESSAGE = "Passwords do not match"
    private val PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters"
    private val BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)"
    private val DUPLICATE_USERNAME_MESSAGE = "Username already taken"

    private val REGISTER_PASSWORD = "password123"

    /** Throwaway registered by the test — deleted through the API afterwards. */
    private var registeredUser: User? = null

    @AfterEach
    fun cleanupRegisteredUser() {
        val user = registeredUser ?: return
        AuthApiClient.deleteAccountQuietly(user.username(), user.password())
        registeredUser = null
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    fun shouldRegisterNewUser() {
        val user = UserBuilder().withUsername().withPassword().build()
        registeredUser = user
        app.register.open().signup(user.username(), user.password())
        assertThat(app.home.welcomeMessage).containsText(user.welcomeMessage())
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register with 3-character login and 6-character password")
    fun shouldRegisterWithMinimumLengthCredentials() {
        val user = User(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength())
        registeredUser = user
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
    @DisplayName("Short password shows validation error")
    fun shouldShowErrorWhenPasswordIsTooShort() {
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
    @DisplayName("Duplicate username shows readable error")
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
    @DisplayName("Short username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsTooShort() {
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
    @DisplayName("Empty username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsEmpty() {
        app.register.open()
            .typePassword("password123")
            .typeConfirmPassword("password123")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsEmpty() {
        app.register.open()
            .typeUsername("newuser")
            .submitExpectingError()
        assertThat(app.register.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    fun shouldShowValidationErrorWhenCredentialsAreEmpty() {
        app.register.open().submitExpectingError()
        assertThat(app.register.errorMessage).containsText(BOTH_REQUIRED_MESSAGE)
    }
}
