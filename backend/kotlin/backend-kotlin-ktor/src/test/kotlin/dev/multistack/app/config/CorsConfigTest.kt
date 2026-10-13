package dev.multistack.app.config

import dev.multistack.app.appModule
import dev.multistack.app.support.TestApp
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.options
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("CORS")
class CorsConfigTest {

    @Test
    @DisplayName("preflight OPTIONS /api/items answers allow-origin * and the API methods")
    fun preflightAnswersCors() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.options("/api/items") {
            header(HttpHeaders.Origin, "https://example.test")
            header(HttpHeaders.AccessControlRequestMethod, "GET")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("*", response.headers[HttpHeaders.AccessControlAllowOrigin])
        val methods = response.headers[HttpHeaders.AccessControlAllowMethods] ?: ""
        listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").forEach {
            assert(methods.contains(it)) { "missing $it in $methods" }
        }
    }

    @Test
    @DisplayName("GET /api/health carries allow-origin * for browser calls")
    fun simpleRequestCarriesCorsHeaders() = testApplication {
        application { appModule(TestApp.freshDependencies()) }

        val response = client.get("/api/health") {
            header(HttpHeaders.Origin, "https://example.test")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        assertNotNull(response.headers[HttpHeaders.AccessControlAllowOrigin])
    }
}
