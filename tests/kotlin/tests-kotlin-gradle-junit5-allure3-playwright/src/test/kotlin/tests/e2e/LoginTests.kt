package tests.e2e

import annotations.Layer
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import tests.TestBase

@Layer("e2e")
@Epic("Authentication")
@Feature("Login")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Login")
class LoginTests : TestBase() {

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @Tag("positive")
    @DisplayName("User is logged in with valid credentials")
    fun shouldLoginWithValidCredentials() {
        app.login.open().login("user1", "password1")
        assertThat(app.home.welcomeMessage).containsText("Welcome, user1!")
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsEmpty() {
        app.login.open().typePassword("password1").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(LOGIN_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsEmpty() {
        app.login.open().typeUsername("user1").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(PASSWORD_REQUIRED_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Wrong password shows readable error")
    fun shouldShowErrorWhenPasswordIsWrong() {
        app.login.open().typeUsername("user1").typePassword("wrongpassword").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(WRONG_CREDENTIALS_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short username shows validation error")
    fun shouldShowValidationErrorWhenUsernameIsShort() {
        app.login.open().typeUsername("ab").typePassword("password1").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(LOGIN_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Short password shows validation error")
    fun shouldShowValidationErrorWhenPasswordIsShort() {
        app.login.open().typeUsername("user1").typePassword("123").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(PASSWORD_MIN_LENGTH_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Unknown username shows the same readable error")
    fun shouldShowErrorWhenUsernameIsUnknown() {
        app.login.open().typeUsername("nouser").typePassword("password1").submitExpectingError()
        assertThat(app.login.errorMessage).containsText(WRONG_CREDENTIALS_MESSAGE)
    }

    @Test
    @Tag("e2e")
    @Tag("negative")
    @DisplayName("Empty username and password show combined validation error")
    fun shouldShowValidationErrorWhenBothAreEmpty() {
        app.login.open().submitExpectingError()
        assertThat(app.login.errorMessage).containsText(BOTH_REQUIRED_MESSAGE)
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
        private const val WRONG_CREDENTIALS_MESSAGE = "Wrong login or password"
    }
}
