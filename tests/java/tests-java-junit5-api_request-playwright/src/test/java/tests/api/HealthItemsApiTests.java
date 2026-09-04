package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.HttpResult;
import api.JsonSchemas;
import api.PlaywrightHttp;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * HTTP contract of {@code /api/health} and {@code /api/items}: shapes and types, not deployment facts.
 * Which service answers and where the data physically lives is asserted by
 * {@code BackendWiringApiTests} and {@code SeedDataApiTests}.
 */
@Layer("api")
@Epic("Home")
@Feature("Health and items")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Health and items API")
class HealthItemsApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @DisplayName("GET /api/health matches the health contract and reports ok")
    void healthMatchesContract() {
        HttpResult response = PlaywrightHttp.request("GET", "/api/health");
        assertEquals(200, response.status(), response.body());
        JsonSchemas.assertMatches(response.body(), "health.json");
        assertEquals("ok", response.text("status"));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/items matches the items contract (typed rows, named source)")
    void itemsMatchContract() {
        HttpResult response = PlaywrightHttp.request("GET", "/api/items");
        assertEquals(200, response.status(), response.body());
        JsonSchemas.assertMatches(response.body(), "items.json");
    }
}
