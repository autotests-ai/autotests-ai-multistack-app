package tests.e2e

import tests.TestBase
import annotations.Layer
import api.AuthApiClient
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
        if (registeredUser != null) {
            AuthApiClient.deleteAccountQuietly(registeredUser!!.username(), registeredUser!!.password())
            registeredUser = null
        }
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("New user can register and land on home")
    fun shouldRegisterNewUser() {
        registeredUser = UserBuilder().withUsername().withPassword().build()
        registerPage.openPage()
                .fillAndSubmitForm(
                        registeredUser!!.username(),
                        registeredUser!!.password(),
                        registeredUser!!.password())
                .shouldHaveWelcomeMessage(registeredUser!!.welcomeMessage())
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Password mismatch shows validation error")
    fun shouldShowErrorWhenPasswordsDoNotMatch() {
        registerPage.openPage()
                .typeUsername("newuser")
                .typePassword("password123")
                .typeConfirmPassword("password124")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MISMATCH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    fun shouldShowErrorWhenPasswordIsTooShort() {
        registerPage.openPage()
                .typeUsername("newuser")
                .typePassword("abc")
                .typeConfirmPassword("abc")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Duplicate username shows readable error")
    fun shouldShowErrorWhenUsernameIsTaken() {
        registerPage.openPage()
                .typeUsername("user1")
                .typePassword(REGISTER_PASSWORD)
                .typeConfirmPassword(REGISTER_PASSWORD)
                .submitExpectingError()
                .shouldHaveErrorMessage(DUPLICATE_USERNAME_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsTooShort() {
        registerPage.openPage()
                .typeUsername("ab")
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsEmpty() {
        registerPage.openPage()
                .typePassword("password123")
                .typeConfirmPassword("password123")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsEmpty() {
        registerPage.openPage()
                .typeUsername("newuser")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    fun shouldShowValidationErrorWhenCredentialsAreEmpty() {
        registerPage.openPage()
                .submitExpectingError()
                .shouldHaveErrorMessage(BOTH_REQUIRED_MESSAGE)
    }
}
