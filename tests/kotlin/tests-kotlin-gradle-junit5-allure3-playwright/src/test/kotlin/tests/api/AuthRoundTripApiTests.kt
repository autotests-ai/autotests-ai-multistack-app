package tests.api

import annotations.Layer
import api.ApiTestBase
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
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

@Layer("api")
@Epic("Authentication")
@Feature("Account lifecycle")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth account lifecycle on deployed stand")
class AuthRoundTripApiTests : ApiTestBase() {

    /**
     * Full account lifecycle across separate HTTP requests — proves DB and JWT are wired
     * together on the deployed stand, and documents that logout is stateless: the JWT keeps
     * working until the account itself is gone. Deletes the user it registers, so the stand
     * does not accumulate test accounts.
     */
    @Test
    @Tag("api")
    @DisplayName("register → login → me → logout (stateless: token survives) → delete → me is 401")
    fun accountLifecycleRoundTrip() {
        val username = DataFaker.username()
        val password = "password123"

        val registered = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/register",
            json = RegisterRequest(username, password),
        )
        assertEquals(201, registered.status, registered.body)
        assertEquals(username, registered.text("username"))

        val login = KtorHttp.request(
            HttpMethod.Post,
            "/api/auth/login",
            json = LoginRequest(username, password),
        )
        assertEquals(200, login.status, login.body)
        val token = login.text("token")

        val me = KtorHttp.request(HttpMethod.Get, "/api/auth/me", token = token)
        assertEquals(200, me.status, me.body)
        assertEquals(username, me.text("username"))

        val logout = KtorHttp.request(HttpMethod.Post, "/api/auth/logout", token = token)
        assertEquals(204, logout.status, logout.body)

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        val meAfterLogout = KtorHttp.request(HttpMethod.Get, "/api/auth/me", token = token)
        assertEquals(200, meAfterLogout.status, meAfterLogout.body)
        assertEquals(username, meAfterLogout.text("username"))

        val deleted = KtorHttp.request(HttpMethod.Delete, "/api/auth/me", token = token)
        assertEquals(204, deleted.status, deleted.body)

        // The token still verifies cryptographically, but the account is gone → 401.
        val meAfterDelete = KtorHttp.request(HttpMethod.Get, "/api/auth/me", token = token)
        assertEquals(401, meAfterDelete.status, meAfterDelete.body)
    }
}
