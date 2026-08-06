package tests.integration;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@Layer("integration")
@Epic("Authentication")
@Feature("Session round-trip")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth round-trip")
class AuthRoundTripIntegrationTests extends ApiTestBase {

    @Test
    @Tag("integration")
    @DisplayName("register → login → me → logout survives separate HTTP requests (DB + JWT wired)")
    void registerLoginProfileLogoutRoundTrip() {
        String username = "int_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        String password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}")
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201)
                .body("username", equalTo(username));

        String sessionToken = given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}")
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        given()
                .header("Authorization", "Bearer " + sessionToken)
                .when()
                .get("/api/auth/me")
                .then()
                .statusCode(200)
                .body("username", equalTo(username));

        given()
                .header("Authorization", "Bearer " + sessionToken)
                .when()
                .post("/api/auth/logout")
                .then()
                .statusCode(204);
    }
}
