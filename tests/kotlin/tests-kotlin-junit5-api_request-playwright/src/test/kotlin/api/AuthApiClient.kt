package api

import api.model.LoginRequest
import api.model.RegisterRequest
import io.qameta.allure.Step
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

/**
 * Thin Playwright APIRequest client for test setup and cleanup. API tests use it to arrange
 * state through the product API instead of duplicating raw JSON strings.
 */
class AuthApiClient private constructor() {
    companion object {
        @JvmStatic
        @Step("API: register user {username}")
        fun register(username: String, password: String): String {
            val response = PlaywrightHttp.request(
                "POST",
                "/api/auth/register",
                json = RegisterRequest(username, password),
            )
            assertEquals(201, response.status, response.body)
            val token = response.text("token")
            assertTrue(token.isNotBlank(), response.body)
            return token
        }

        @JvmStatic
        @Step("API: login as {username}")
        fun login(username: String, password: String): String {
            val response = PlaywrightHttp.request(
                "POST",
                "/api/auth/login",
                json = LoginRequest(username, password),
            )
            assertEquals(200, response.status, response.body)
            val token = response.text("token")
            assertTrue(token.isNotBlank(), response.body)
            return token
        }

        @JvmStatic
        @Step("API: delete current account")
        fun deleteAccount(token: String) {
            val response = PlaywrightHttp.request("DELETE", "/api/auth/me", token = token)
            assertEquals(204, response.status, response.body)
        }

        /** Cleanup that must not mask the original test failure: logs in and deletes, best-effort. */
        @JvmStatic
        fun deleteAccountQuietly(username: String, password: String) {
            try {
                deleteAccount(login(username, password))
            } catch (_: AssertionError) {
                // The test that created the user is responsible for its own assertions.
            } catch (_: RuntimeException) {
                // A failed cleanup (user never created, stand down) must not re-fail it.
            }
        }
    }
}
