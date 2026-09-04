package tests.e2e

import tests.TestBase
import annotations.Layer
import api.AuthApiClient
import helpers.DataFaker
import helpers.User
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
@Feature("Login")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Login")
class LoginTests : TestBase() {

    private val LOGIN_REQUIRED_MESSAGE =
            "Login is required (minimum 3 characters)"
    private val LOGIN_MIN_LENGTH_MESSAGE =
            "Login must be at least 3 characters"
    private val PASSWORD_REQUIRED_MESSAGE =
            "Password is required (minimum 6 characters)"
    private val PASSWORD_MIN_LENGTH_MESSAGE =
            "Password must be at least 6 characters"
    private val BOTH_REQUIRED_MESSAGE =
            "Login and password are required (minimum 3 and 6 characters)"
    private val WRONG_CREDENTIALS_MESSAGE = "Wrong login or password"

    private var minLengthUser: User? = null

    @AfterEach
    fun cleanupMinLengthUser() {
        if (minLengthUser != null) {
            AuthApiClient.deleteAccountQuietly(minLengthUser!!.username(), minLengthUser!!.password())
            minLengthUser = null
        }
    }

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    fun shouldLoginWithValidCredentials() {
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!")
    }

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User is logged in with 3-character login and 6-character password")
    fun shouldLoginWithMinimumLengthCredentials() {
        minLengthUser = User(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength())
        AuthApiClient.register(minLengthUser!!.username(), minLengthUser!!.password())
        loginPage.openPage()
                .fillAndSubmitForm(minLengthUser!!.username(), minLengthUser!!.password())
                .shouldHaveWelcomeMessage(minLengthUser!!.welcomeMessage())
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsEmpty() {
        loginPage.openPage()
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsEmpty() {
        loginPage.openPage()
                .typeUsername("user1")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Wrong password shows readable error")
    fun shouldShowErrorWhenPasswordIsWrong() {
        loginPage.openPage()
                .typeUsername("user1")
                .typePassword("wrongpassword")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsTooShort() {
        loginPage.openPage()
                .typeUsername("ab")
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(LOGIN_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsTooShort() {
        loginPage.openPage()
                .typeUsername("user1")
                .typePassword("123")
                .submitExpectingError()
                .shouldHaveErrorMessage(PASSWORD_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Unknown username shows readable error")
    fun shouldShowErrorWhenUsernameIsUnknown() {
        loginPage.openPage()
                .typeUsername("nouser")
                .typePassword("password1")
                .submitExpectingError()
                .shouldHaveErrorMessage(WRONG_CREDENTIALS_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show validation error")
    fun shouldShowValidationErrorWhenCredentialsAreEmpty() {
        loginPage.openPage()
                .submitExpectingError()
                .shouldHaveErrorMessage(BOTH_REQUIRED_MESSAGE)
    }
}
