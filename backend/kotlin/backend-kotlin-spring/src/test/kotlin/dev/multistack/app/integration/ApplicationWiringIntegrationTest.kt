package dev.multistack.app.integration

import dev.multistack.app.dto.HealthResponse
import dev.multistack.app.dto.ItemsResponse
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

@DisplayName("Application wiring on real PostgreSQL")
class ApplicationWiringIntegrationTest : IntegrationTestBase() {

    @Test
    @DisplayName("GET /api/health — full stack reports the active backend module")
    fun healthReportsActiveBackendService() {
        val response = getJson("/api/health", HealthResponse::class.java)

        assertEquals(HttpStatus.OK, response.statusCode)
        assertNotNull(response.body)
        assertEquals("ok", response.body!!.status)
        assertEquals("backend-kotlin-spring", response.body!!.service)
    }

    @Test
    @DisplayName("GET /api/items — catalogue is served from PostgreSQL with Flyway seed")
    fun itemsAreWiredToPostgreSQL() {
        val response = getJson("/api/items", ItemsResponse::class.java)

        assertEquals(HttpStatus.OK, response.statusCode)
        assertNotNull(response.body)
        assertEquals("postgresql", response.body!!.source)
        assertEquals(3, response.body!!.items.size)
        assertEquals("Alpha", response.body!!.items.first().name)
        assertEquals("Beta", response.body!!.items[1].name)
        assertEquals("Gamma", response.body!!.items.last().name)
    }
}
