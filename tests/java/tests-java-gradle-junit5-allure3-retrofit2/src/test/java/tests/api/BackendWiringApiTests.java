package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.Calls;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Deployed-stand facts about the active backend module and its PostgreSQL wiring.
 * Response shapes/types are the api layer's job ({@code HealthItemsApiTests}).
 */
@Layer("api")
@Epic("Wired backend")
@Feature("Health and data source")
@Severity(SeverityLevel.BLOCKER)
@DisplayName("Backend wiring on deployed stand")
class BackendWiringApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @Tag("smoke")
    @DisplayName("GET /api/health — deployed service is the active backend module, not a neighbour")
    void healthReportsActiveBackendService() {
        var response = Calls.execute(api.health());
        assertEquals(200, response.code());
        assertNotNull(response.body());
        assertEquals(config.apiHealthService(), response.body().service());
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")
    void itemsAreWiredToPostgreSQL() {
        var response = Calls.execute(api.items());
        assertEquals(200, response.code());
        assertNotNull(response.body());
        assertEquals("postgresql", response.body().source());
    }
}
