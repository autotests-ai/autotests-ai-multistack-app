package dev.multistack.app.integration

import dev.multistack.app.allure.IntegrationTestBase
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.util.UUID

@Epic("Authentication")
@Feature("Account lifecycle")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth account lifecycle in-process")
class AuthLifecycleIntegrationTest : IntegrationTestBase() {

    /**
     * Full account lifecycle through the running Ktor app — proves DB and JWT are wired
     * together, and documents that logout is stateless: the JWT keeps working until the
     * account itself is gone.
     */
    @Test
    @DisplayName("register → login → me → logout (stateless: token survives) → delete → me is 401")
    fun accountLifecycleRoundTrip() {
        val username = "int_" + UUID.randomUUID().toString().substring(0, 8)
        val body = """{"username":"$username","password":"password123"}"""

        val register = postJson("$apiBase/api/auth/register", body)
        assertEquals(201, register.statusCode())
        assertEquals(
            username,
            kotlinx.serialization.json.Json.parseToJsonElement(register.body())
                .jsonObject["username"]!!.jsonPrimitive.content,
        )

        val login = postJson("$apiBase/api/auth/login", body)
        assertEquals(200, login.statusCode())
        val token = kotlinx.serialization.json.Json.parseToJsonElement(login.body())
            .jsonObject["token"]!!.jsonPrimitive.content
        assertTrue(token.isNotEmpty())

        val me = get("$apiBase/api/auth/me", token)
        assertEquals(200, me.statusCode())
        assertEquals(
            username,
            kotlinx.serialization.json.Json.parseToJsonElement(me.body())
                .jsonObject["username"]!!.jsonPrimitive.content,
        )

        val logout = postJson("$apiBase/api/auth/logout", "", token)
        assertEquals(204, logout.statusCode())

        // Stateless logout: the JWT still verifies cryptographically…
        val meAfterLogout = get("$apiBase/api/auth/me", token)
        assertEquals(200, meAfterLogout.statusCode())

        val delete = delete("$apiBase/api/auth/me", token)
        assertEquals(204, delete.statusCode())

        // …but once the account row is gone, every user-resolving endpoint answers 401.
        val meAfterDelete = get("$apiBase/api/auth/me", token)
        assertEquals(401, meAfterDelete.statusCode())
    }
}
