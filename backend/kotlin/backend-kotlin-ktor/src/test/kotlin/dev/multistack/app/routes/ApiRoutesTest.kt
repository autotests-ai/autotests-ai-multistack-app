package dev.multistack.app.routes

import dev.multistack.app.appModule
import dev.multistack.app.support.TestApp
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("ApiRoutes")
class ApiRoutesTest {

    @Test
    @DisplayName("GET /api/health returns ok + module service name")
    fun healthReturnsOk() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/health")

        assertEquals(HttpStatusCode.OK, response.status)
        val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
        assertEquals("ok", body["status"]!!.jsonPrimitive.content)
        assertEquals("backend-kotlin-ktor", body["service"]!!.jsonPrimitive.content)
    }

    @Test
    @DisplayName("GET /api/items returns the seeded rows with postgresql source")
    fun itemsReturnsSeededRows() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/items")

        assertEquals(HttpStatusCode.OK, response.status)
        val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
        assertEquals("postgresql", body["source"]!!.jsonPrimitive.content)
        val names = body["items"]!!.jsonArray.map { it.jsonObject["name"]!!.jsonPrimitive.content }
        assertEquals(listOf("Alpha", "Beta", "Gamma"), names)
    }

    @Test
    @DisplayName("GET /api/openapi.yaml serves the shared contract copy")
    fun servesOpenApiSpec() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/openapi.yaml")

        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("application/yaml", response.headers["Content-Type"])
        assertTrue(response.bodyAsText().contains("/api/auth/register"))
    }

    @Test
    @DisplayName("an unexpected backend error answers 500 with the shared envelope")
    fun unexpectedErrorEnvelope() = testApplication {
        val config = dev.multistack.app.config.AppConfig(
            serverPort = 0,
            managementPort = 0,
            jdbcUrl = "jdbc:h2:mem:unused",
            dbUser = "sa",
            dbPassword = "",
            jwtSecret = "test-secret-test-secret-test-secret-32",
            jwtExpirationMs = 3_600_000L,
        )
        val broken = org.mockito.kotlin.mock<javax.sql.DataSource>()
        org.mockito.kotlin.whenever(broken.connection)
            .thenThrow(java.sql.SQLException("down", "08001"))
        application { appModule(dev.multistack.app.AppDependencies(broken, config)) }

        val response = client.get("/api/items")

        assertEquals(HttpStatusCode.InternalServerError, response.status)
        assertEquals(
            "Internal server error",
            Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["message"]!!.jsonPrimitive.content,
        )
    }

    @Test
    @DisplayName("GET /api/docs serves the Swagger UI page")
    fun servesDocsPage() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/docs")

        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue(response.headers["Content-Type"]!!.startsWith("text/html"))
        assertTrue(response.bodyAsText().contains("openapi.yaml"))
    }
}
