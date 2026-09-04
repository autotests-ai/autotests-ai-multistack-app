package dev.multistack.app.integration

import dev.multistack.app.allure.IntegrationTestBase
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.server.LocalManagementPort
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.ResponseEntity

@Epic("Observability")
@Feature("Actuator Prometheus")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Actuator Prometheus on management port")
class ActuatorPrometheusIntegrationTest : IntegrationTestBase() {

    @LocalServerPort
    private var apiPort: Int = 0

    @LocalManagementPort
    private var managementPort: Int = 0

    @Test
    @DisplayName("GET /actuator/prometheus on the API port is not 200")
    fun actuatorOnApiPortIsNotOk() {
        val response = getJson("/actuator/prometheus", String::class.java)
        assertNotEquals(200, response.statusCode.value())
    }

    @Test
    @DisplayName("GET /actuator/prometheus on the management port is 200 and includes jvm_memory_*")
    fun prometheusScrapeOnManagementPort() {
        val url = "http://127.0.0.1:$managementPort/actuator/prometheus"
        val response: ResponseEntity<String> = rest.getForEntity(url, String::class.java)
        assertEquals(200, response.statusCode.value())
        assertNotNull(response.body)
        assertTrue(response.body!!.contains("jvm_memory_"), response.body)
    }

    @Test
    @DisplayName("GET /actuator/health on the management port is 200")
    fun healthOnManagementPort() {
        val url = "http://127.0.0.1:$managementPort/actuator/health"
        val response: ResponseEntity<String> = rest.getForEntity(url, String::class.java)
        assertEquals(200, response.statusCode.value())
        assertNotNull(response.body)
        assertTrue(response.body!!.contains("UP"), response.body)
    }

    @Test
    @DisplayName("API and management bind distinct ports")
    fun managementPortIsNotApiPort() {
        assertNotEquals(apiPort, managementPort)
        assertTrue(managementPort > 0)
    }
}
