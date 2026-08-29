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

import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("api")
@Epic("Deploy readiness")
@Feature("Seed data")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Seed data on deployed stand")
class SeedDataApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @Tag("smoke")
    @DisplayName("Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")
    void seededItemsAreReadyAfterDeploy() {
        var response = Calls.execute(api.items());
        assertEquals(200, response.code());
        var body = response.body();
        assertNotNull(body);
        assertEquals("postgresql", body.source());
        var names = body.items().stream().map(Item::name).collect(Collectors.toSet());
        assertTrue(names.contains("Alpha"));
        assertTrue(names.contains("Beta"));
        assertTrue(names.contains("Gamma"));
    }
}
