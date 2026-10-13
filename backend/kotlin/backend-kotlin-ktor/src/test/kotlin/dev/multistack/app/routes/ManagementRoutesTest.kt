package dev.multistack.app.routes

import dev.multistack.app.managementModule
import dev.multistack.app.support.TestApp
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("ManagementRoutes")
class ManagementRoutesTest {

    @Test
    @DisplayName("GET /actuator/health answers UP as JSON")
    fun healthReturnsUp() = testApplication {
        application { managementModule(TestApp.freshDependencies()) }

        val response = client.get("/actuator/health")

        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals(
            "UP",
            Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["status"]!!.jsonPrimitive.content,
        )
    }

    @Test
    @DisplayName("GET /actuator/prometheus exposes JVM metrics for the scrape")
    fun prometheusScrape() = testApplication {
        application { managementModule(TestApp.freshDependencies()) }

        val response = client.get("/actuator/prometheus")

        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue(response.bodyAsText().contains("jvm_memory_"), response.bodyAsText())
    }
}
