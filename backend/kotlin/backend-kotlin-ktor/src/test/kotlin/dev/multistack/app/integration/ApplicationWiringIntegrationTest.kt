package dev.multistack.app.integration

import dev.multistack.app.allure.IntegrationTestBase
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@Epic("Wiring")
@Feature("Application wiring")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Application wiring on real Postgres")
class ApplicationWiringIntegrationTest : IntegrationTestBase() {

    @Test
    @DisplayName("GET /api/health answers ok with the module service name")
    fun healthAnswersModuleName() {
        val response = get("$apiBase/api/health")

        assertEquals(200, response.statusCode())
        val body = kotlinx.serialization.json.Json.parseToJsonElement(response.body()).jsonObject
        assertEquals("ok", body["status"]!!.jsonPrimitive.content)
        assertEquals("backend-kotlin-ktor", body["service"]!!.jsonPrimitive.content)
    }

    @Test
    @DisplayName("GET /api/items returns the seeded rows from real Postgres")
    fun itemsComeFromPostgres() {
        val response = get("$apiBase/api/items")

        assertEquals(200, response.statusCode())
        val body = kotlinx.serialization.json.Json.parseToJsonElement(response.body()).jsonObject
        assertEquals("postgresql", body["source"]!!.jsonPrimitive.content)
        assertTrue(body["items"]!!.jsonArray.size >= 3, response.body())
    }

    @Test
    @DisplayName("GET /api/openapi.yaml serves the shared contract")
    fun servesContract() {
        val response = get("$apiBase/api/openapi.yaml")

        assertEquals(200, response.statusCode())
        assertTrue(response.body().contains("/api/auth/register"))
    }
}
