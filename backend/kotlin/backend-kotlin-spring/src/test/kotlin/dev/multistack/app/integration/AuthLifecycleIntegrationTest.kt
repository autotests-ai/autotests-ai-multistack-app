package dev.multistack.app.integration

import dev.multistack.app.allure.IntegrationTestBase
import dev.multistack.app.dto.AuthResponse
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.dto.UserProfileResponse
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.util.UUID

@Epic("Authentication")
@Feature("Account lifecycle")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth account lifecycle in-process")
class AuthLifecycleIntegrationTest : IntegrationTestBase() {

    /**
     * Full account lifecycle through the running Spring context — proves DB and JWT are wired
     * together, and documents that logout is stateless: the JWT keeps working until the account
     * itself is gone.
     */
    @Test
    @DisplayName("register → login → me → logout (stateless: token survives) → delete → me is 401")
    fun accountLifecycleRoundTrip() {
        val username = "int_" + UUID.randomUUID().toString().substring(0, 8)
        val password = "password123"

        val register = postJson(
            "/api/auth/register",
            RegisterRequest(username, password),
            AuthResponse::class.java,
        )
        assertEquals(HttpStatus.CREATED, register.statusCode)
        assertNotNull(register.body)
        assertEquals(username, register.body!!.username)

        val login = postJson(
            "/api/auth/login",
            LoginRequest(username, password),
            AuthResponse::class.java,
        )
        assertEquals(HttpStatus.OK, login.statusCode)
        assertNotNull(login.body)
        val token = login.body!!.token

        val profile = exchangeJson(
            "/api/auth/me",
            HttpMethod.GET,
            bearerEntity(token),
            UserProfileResponse::class.java,
        )
        assertEquals(HttpStatus.OK, profile.statusCode)
        assertNotNull(profile.body)
        assertEquals(username, profile.body!!.username)

        val logout = exchangeJson(
            "/api/auth/logout",
            HttpMethod.POST,
            bearerEntity(token),
            Void::class.java,
        )
        assertEquals(HttpStatus.NO_CONTENT, logout.statusCode)

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        val afterLogout = exchangeJson(
            "/api/auth/me",
            HttpMethod.GET,
            bearerEntity(token),
            UserProfileResponse::class.java,
        )
        assertEquals(HttpStatus.OK, afterLogout.statusCode)
        assertNotNull(afterLogout.body)
        assertEquals(username, afterLogout.body!!.username)

        val delete = exchangeJson(
            "/api/auth/me",
            HttpMethod.DELETE,
            bearerEntity(token),
            Void::class.java,
        )
        assertEquals(HttpStatus.NO_CONTENT, delete.statusCode)

        // The token still verifies cryptographically, but the account is gone → 401.
        val afterDelete = exchangeJson(
            "/api/auth/me",
            HttpMethod.GET,
            bearerEntity(token),
            String::class.java,
        )
        assertEquals(HttpStatus.UNAUTHORIZED, afterDelete.statusCode)
    }
}
