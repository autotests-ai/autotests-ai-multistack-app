package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.HttpResult;
import api.PlaywrightHttp;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        HttpResult response = PlaywrightHttp.request("GET", "/api/items");
        assertEquals(200, response.status(), response.body());
        assertEquals("postgresql", response.text("source"));
        assertTrue(response.itemNames().containsAll(List.of("Alpha", "Beta", "Gamma")), response.body());
    }
}
