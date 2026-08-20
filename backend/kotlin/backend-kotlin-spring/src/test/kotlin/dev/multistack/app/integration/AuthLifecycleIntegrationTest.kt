package dev.multistack.app.integration

import dev.multistack.app.dto.AuthResponse
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.dto.UserProfileResponse
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import java.util.UUID

@DisplayName("Auth account lifecycle in-process")
class AuthLifecycleIntegrationTest : IntegrationTestBase() {

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

        val afterDelete = exchangeJson(
            "/api/auth/me",
            HttpMethod.GET,
            bearerEntity(token),
            String::class.java,
        )
        assertEquals(HttpStatus.UNAUTHORIZED, afterDelete.statusCode)
    }
}
