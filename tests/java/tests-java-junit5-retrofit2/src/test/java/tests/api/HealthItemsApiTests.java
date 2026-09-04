package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.Calls;
import api.model.Item;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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
        var response = Calls.execute(api.health());
        assertEquals(200, response.code());
        var body = response.body();
        assertNotNull(body);
        assertEquals("ok", body.status());
        assertNotNull(body.service());
        assertFalse(body.service().isBlank());
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/items matches the items contract (typed rows, named source)")
    void itemsMatchContract() {
        var response = Calls.execute(api.items());
        assertEquals(200, response.code());
        var body = response.body();
        assertNotNull(body);
        assertNotNull(body.source());
        assertFalse(body.source().isBlank());
        assertNotNull(body.items());
        for (Item item : body.items()) {
            assertFalse(item.name().isBlank());
            assertFalse(item.description().isBlank());
        }
    }
}
