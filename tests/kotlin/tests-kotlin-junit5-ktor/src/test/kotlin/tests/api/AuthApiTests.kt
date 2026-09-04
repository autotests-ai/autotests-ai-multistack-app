package tests.api

import annotations.Layer
import api.ApiTestBase
import api.AuthApiClient
import api.HttpResult
import api.JsonSchemas
import api.KtorHttp
import api.model.LoginRequest
import api.model.RegisterRequest
import helpers.DataFaker
import io.ktor.http.HttpMethod
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

/**
 * HTTP contract of `/api/auth` (login, register, me, logout): status codes, response schemas, error envelopes.
 * Deployed-stand wiring facts (seed catalogue, DB round-trips) live in sibling `*ApiTests`.
 */
@Layer("api")
@Epic("Authentication")
@Feature("Authentication")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth API")
class AuthApiTests : ApiTestBase() {

    @Test
    @Tag("api")
    @Tag("smoke")
    @DisplayName("POST /api/auth/login returns the auth contract for a seeded user")
    fun loginWithValidCredentials() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest("user1", "password1"),
        )
        assertEquals(200, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "auth-response.json")
        assertEquals("user1", response.text("username"))
        assertEquals("/", response.text("redirectUrl"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login rejects a wrong password with 401")
    fun loginWithInvalidPassword() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest("user1", "wrongpassword"),
        )
        assertEquals(401, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        assertEquals(KtorHttp.WRONG_CREDENTIALS_MESSAGE, response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")
    fun loginWithUnknownUsername() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest(DataFaker.username(), "password123"),
        )
        assertEquals(401, response.status, response.body)
        assertEquals(KtorHttp.WRONG_CREDENTIALS_MESSAGE, response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login joins both field errors into one 400 message")
    fun loginRejectsEmptyCredentials() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest("", ""),
        )
        assertEquals(400, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        val message = response.text("message")
        assertTrue(message.contains("username"), message)
        assertTrue(message.contains("password"), message)
        assertTrue(message.contains("; "), message)
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects a short username with 400")
    fun loginRejectsShortUsername() {
        assertErrorContains(
            KtorHttp.request(HttpMethod.Post, "/api/auth/login", json = LoginRequest("ab", "password1")),
            400,
            "username",
        )
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects a short password with 400")
    fun loginRejectsShortPassword() {
        assertErrorContains(
            KtorHttp.request(HttpMethod.Post, "/api/auth/login", json = LoginRequest("user1", "123")),
            400,
            "password",
        )
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects an empty username with 400")
    fun loginRejectsEmptyUsername() {
        assertErrorContains(
            KtorHttp.request(HttpMethod.Post, "/api/auth/login", json = LoginRequest("", "password1")),
            400,
            "username",
        )
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects an empty password with 400")
    fun loginRejectsEmptyPassword() {
        assertErrorContains(
            KtorHttp.request(HttpMethod.Post, "/api/auth/login", json = LoginRequest("user1", "")),
            400,
            "password",
        )
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login answers a malformed JSON body with 400, not 401")
    fun loginRejectsMalformedJson() {
        val response = KtorHttp.request(HttpMethod.Post, "/api/auth/login", raw = "not json")
        assertEquals(400, response.status, response.body)
        assertEquals("Request body is not valid JSON", response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register creates a user, returns the auth contract, and cleans up")
    fun registerNewUser() {
        val username = DataFaker.username()
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/register",
            json = RegisterRequest(username, "password123"),
        )
        assertEquals(201, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "auth-response.json")
        assertEquals(username, response.text("username"))
        assertEquals("/", response.text("redirectUrl"))
        AuthApiClient.deleteAccount(response.text("token"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register accepts a 3-character username and 6-character password")
    fun registerAcceptsMinimumLengthCredentials() {
        val username = DataFaker.usernameAtMinLength()
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/register",
            json = RegisterRequest(username, DataFaker.passwordAtMinLength()),
        )
        assertEquals(201, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "auth-response.json")
        assertEquals(username, response.text("username"))
        AuthApiClient.deleteAccount(response.text("token"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login with min-length unknown user is 401, not 400")
    fun loginMinLengthUnknownUserIsUnauthorized() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest(DataFaker.usernameAtMinLength(), DataFaker.passwordAtMinLength()),
        )
        assertEquals(401, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        assertEquals("Wrong login or password", response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a duplicate username with 409")
    fun registerDuplicateUsername() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/register",
            json = RegisterRequest("user1", "password123"),
        )
        assertEquals(409, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        assertEquals("Username already taken", response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a short password with 400")
    fun registerRejectsShortPassword() {
        assertErrorContains(
            KtorHttp.request(
                HttpMethod.Post,
                "/api/auth/register",
                json = RegisterRequest("shortuser", "abc"),
            ),
            400,
            "password",
        )
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a short username with 400")
    fun registerRejectsShortUsername() {
        assertErrorContains(
            KtorHttp.request(
                HttpMethod.Post,
                "/api/auth/register",
                json = RegisterRequest("ab", "password123"),
            ),
            400,
            "username",
        )
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects an empty username with 400")
    fun registerRejectsEmptyUsername() {
        assertErrorContains(
            KtorHttp.request(
                HttpMethod.Post,
                "/api/auth/register",
                json = RegisterRequest("", "password123"),
            ),
            400,
            "username",
        )
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects an empty password with 400")
    fun registerRejectsEmptyPassword() {
        assertErrorContains(
            KtorHttp.request(
                HttpMethod.Post,
                "/api/auth/register",
                json = RegisterRequest("newuser", ""),
            ),
            400,
            "password",
        )
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register joins both field errors into one 400 message")
    fun registerRejectsEmptyCredentials() {
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/register",
            json = RegisterRequest("", ""),
        )
        assertEquals(400, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        val message = response.text("message")
        assertTrue(message.contains("username"), message)
        assertTrue(message.contains("password"), message)
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register answers a malformed JSON body with 400, not 401")
    fun registerRejectsMalformedJson() {
        val response = KtorHttp.request(HttpMethod.Post, "/api/auth/register", raw = "not json")
        assertEquals(400, response.status, response.body)
        assertEquals("Request body is not valid JSON", response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me returns the profile contract for a bearer token")
    fun profileWithBearerToken() {
        val token = AuthApiClient.login("user1", "password1")
        val response = KtorHttp.request(HttpMethod.Get, "/api/auth/me", token = token)
        assertEquals(200, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "profile.json")
        assertEquals("user1", response.text("username"))
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me without a token returns 401")
    fun profileWithoutToken() {
        val response = KtorHttp.request(HttpMethod.Get, "/api/auth/me")
        assertEquals(401, response.status, response.body)
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me with a garbage token returns 401")
    fun profileWithGarbageToken() {
        val response = KtorHttp.request(HttpMethod.Get, "/api/auth/me", token = "not-a-jwt")
        assertEquals(401, response.status, response.body)
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/logout returns 204")
    fun logoutReturnsNoContent() {
        val response = KtorHttp.request(HttpMethod.Post, "/api/auth/logout")
        assertEquals(204, response.status, response.body)
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("DELETE /api/auth/me without a token returns 401")
    fun deleteWithoutToken() {
        val response = KtorHttp.request(HttpMethod.Delete, "/api/auth/me")
        assertEquals(401, response.status, response.body)
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("DELETE /api/auth/me with a garbage token returns 401")
    fun deleteWithGarbageToken() {
        val response = KtorHttp.request(HttpMethod.Delete, "/api/auth/me", token = "not-a-jwt")
        assertEquals(401, response.status, response.body)
    }

    @Test
    @Tag("api")
    @DisplayName("DELETE /api/auth/me removes the account: repeated login is rejected")
    fun deleteRemovesAccount() {
        val username = DataFaker.username()
        val token = AuthApiClient.register(username, "password123")
        AuthApiClient.deleteAccount(token)
        val response = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest(username, "password123"),
        )
        assertEquals(401, response.status, response.body)
        assertEquals(KtorHttp.WRONG_CREDENTIALS_MESSAGE, response.text("message"))
    }

    @Test
    @Tag("api")
    @DisplayName("unmapped /api/* path requires authentication (security catch-all)")
    fun unmappedApiPathRequiresAuthentication() {
        val response = KtorHttp.request(HttpMethod.Get, "/api/nope")
        assertEquals(401, response.status, response.body)
    }

    private fun assertErrorContains(response: HttpResult, status: Int, fragment: String) {
        assertEquals(status, response.status, response.body)
        JsonSchemas.assertMatches(response.body, "error.json")
        assertTrue(response.text("message").contains(fragment), response.body)
    }
}
