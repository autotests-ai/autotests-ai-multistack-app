package dev.multistack.app.integration

import dev.multistack.app.allure.IntegrationTestBase
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.net.URI

@Epic("Observability")
@Feature("Actuator Prometheus")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Actuator Prometheus on management port")
class ActuatorPrometheusIntegrationTest : IntegrationTestBase() {

    @Test
    @DisplayName("GET /actuator/prometheus on the API port is not 200")
    fun actuatorOnApiPortIsNotOk() {
        val response = get("$apiBase/actuator/prometheus")

        assertNotEquals(200, response.statusCode())
    }

    @Test
    @DisplayName("GET /actuator/prometheus on the management port is 200 and includes jvm_memory_*")
    fun prometheusScrapeOnManagementPort() {
        val response = get("$managementBase/actuator/prometheus")

        assertEquals(200, response.statusCode())
        assertTrue(response.body().contains("jvm_memory_"), response.body())
    }

    @Test
    @DisplayName("GET /actuator/health on the management port is 200")
    fun healthOnManagementPort() {
        val response = get("$managementBase/actuator/health")

        assertEquals(200, response.statusCode())
        assertTrue(response.body().contains("UP"), response.body())
    }

    @Test
    @DisplayName("API and management bind distinct ports")
    fun managementPortIsNotApiPort() {
        val apiPort = URI.create(apiBase).port
        val managementPort = URI.create(managementBase).port

        assertNotEquals(apiPort, managementPort)
        assertTrue(managementPort > 0)
    }
}
