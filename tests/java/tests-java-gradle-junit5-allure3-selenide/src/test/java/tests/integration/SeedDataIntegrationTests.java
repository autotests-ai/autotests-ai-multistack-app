package tests.integration;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import api.model.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItems;

@Layer("integration")
@Epic("Deploy readiness")
@Feature("Seed data")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Seed data")
class SeedDataIntegrationTests extends ApiTestBase {

    @Test
    @Tag("integration")
    @DisplayName("Seed user user1 is present and can authenticate")
    void seededUserIsReadyAfterDeploy() {
        given(jsonSpec)
                .body(new LoginRequest("user1", "password1"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("username", equalTo("user1"));
    }

    @Test
    @Tag("integration")
    @DisplayName("Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")
    void seededItemsAreReadyAfterDeploy() {
        given()
                .when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .body("source", equalTo("postgresql"))
                .body("items.name", hasItems("Alpha", "Beta", "Gamma"));
    }
}
