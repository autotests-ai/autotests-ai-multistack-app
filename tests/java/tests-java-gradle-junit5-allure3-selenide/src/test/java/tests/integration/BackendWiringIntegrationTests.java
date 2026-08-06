package tests.integration;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@Layer("integration")
@Epic("Wired backend")
@Feature("Health and data source")
@Severity(SeverityLevel.BLOCKER)
@DisplayName("Backend wiring")
class BackendWiringIntegrationTests extends ApiTestBase {

    @Test
    @Tag("integration")
    @DisplayName("GET /api/health — deployed service matches active backend module")
    void healthReportsActiveBackendService() {
        given()
                .when()
                .get("/api/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("ok"))
                .body("service", equalTo(config.apiHealthService()));
    }

    @Test
    @Tag("integration")
    @DisplayName("GET /api/items — catalogue is served from PostgreSQL, not fallback")
    void itemsAreWiredToPostgreSQL() {
        given()
                .when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .body("source", equalTo("postgresql"))
                .body("items.size()", greaterThanOrEqualTo(3));
    }
}
