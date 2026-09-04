package dev.multistack.app.integration;

import dev.multistack.app.allure.IntegrationTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("Observability")
@Feature("Actuator Prometheus")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Actuator Prometheus on management port")
class ActuatorPrometheusIntegrationTest extends IntegrationTestBase {

    @LocalServerPort
    private int apiPort;

    @LocalManagementPort
    private int managementPort;

    @Test
    @DisplayName("GET /actuator/prometheus on the API port is not 200")
    void actuatorOnApiPortIsNotOk() {
        ResponseEntity<String> response = getJson("/actuator/prometheus", String.class);
        assertNotEquals(200, response.getStatusCode().value());
    }

    @Test
    @DisplayName("GET /actuator/prometheus on the management port is 200 and includes jvm_memory_*")
    void prometheusScrapeOnManagementPort() {
        String url = "http://127.0.0.1:" + managementPort + "/actuator/prometheus";
        ResponseEntity<String> response = rest.getForEntity(url, String.class);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("jvm_memory_"), response.getBody());
    }

    @Test
    @DisplayName("GET /actuator/health on the management port is 200")
    void healthOnManagementPort() {
        String url = "http://127.0.0.1:" + managementPort + "/actuator/health";
        ResponseEntity<String> response = rest.getForEntity(url, String.class);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("UP"), response.getBody());
    }

    @Test
    @DisplayName("API and management bind distinct ports")
    void managementPortIsNotApiPort() {
        assertNotEquals(apiPort, managementPort);
        assertTrue(managementPort > 0);
    }
}
