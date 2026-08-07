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

/**
 * Wiring facts about the deployed system — values that depend on which module is deployed
 * and what it is connected to. Response shapes/types are the api layer's job
 * ({@code tests.api.ReferenceApiTests}); this class asserts none of them.
 */
@Layer("integration")
@Epic("Wired backend")
@Feature("Health and data source")
@Severity(SeverityLevel.BLOCKER)
@DisplayName("Backend wiring")
class BackendWiringIntegrationTests extends ApiTestBase {

    @Test
    @Tag("integration")
    @DisplayName("GET /api/health — deployed service is the active backend module, not a neighbour")
    void healthReportsActiveBackendService() {
        given()
                .when()
                .get("/api/health")
                .then()
                .statusCode(200)
                .body("service", equalTo(config.apiHealthService()));
    }

    @Test
    @Tag("integration")
    @DisplayName("GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")
    void itemsAreWiredToPostgreSQL() {
        given()
                .when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .body("source", equalTo("postgresql"));
    }
}
