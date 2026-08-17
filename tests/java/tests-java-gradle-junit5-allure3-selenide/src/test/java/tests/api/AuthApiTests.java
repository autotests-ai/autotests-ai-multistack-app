package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.AuthApiClient;
import api.model.LoginRequest;
import api.model.RegisterRequest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;

/**
 * HTTP contract of {@code /api/auth/*}: status codes, response schemas, error envelopes.
 * Deployed-stand wiring facts (seed catalogue, DB round-trips) live in sibling {@code *ApiTests}.
 */
@Layer("api")
@Epic("Authentication")
@Feature("Authentication")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth API")
class AuthApiTests extends ApiTestBase {

    private static final String WRONG_CREDENTIALS_MESSAGE = "Wrong login or password";

    @Test
    @Tag("api")
    @Tag("smoke")
    @DisplayName("POST /api/auth/login returns the auth contract for a seeded user")
    void loginWithValidCredentials() {
        given(jsonSpec)
                .body(new LoginRequest("user1", "password1"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body(matchesJsonSchemaInClasspath("schemas/auth-response.json"))
                .body("username", equalTo("user1"))
                .body("redirectUrl", equalTo("/"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login rejects a wrong password with 401")
    void loginWithInvalidPassword() {
        given(jsonSpec)
                .body(new LoginRequest("user1", "wrongpassword"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body(matchesJsonSchemaInClasspath("schemas/error.json"))
                .body("message", equalTo(WRONG_CREDENTIALS_MESSAGE));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")
    void loginWithUnknownUsername() {
        given(jsonSpec)
                .body(new LoginRequest("ghost_" + java.util.UUID.randomUUID().toString().substring(0, 8), "password123"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", equalTo(WRONG_CREDENTIALS_MESSAGE));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login joins both field errors into one 400 message")
    void loginRejectsEmptyCredentials() {
        given(jsonSpec)
                .body(new LoginRequest("", ""))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(400)
                .body(matchesJsonSchemaInClasspath("schemas/error.json"))
                .body("message", allOf(
                        containsString("username"),
                        containsString("password"),
                        containsString("; ")));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register creates a user, returns the auth contract, and cleans up")
    void registerNewUser() {
        String username = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        String token = given(jsonSpec)
                .body(new RegisterRequest(username, "password123"))
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201)
                .body(matchesJsonSchemaInClasspath("schemas/auth-response.json"))
                .body("username", equalTo(username))
                .body("redirectUrl", equalTo("/"))
                .extract()
                .path("token");

        AuthApiClient.deleteAccount(token);
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a duplicate username with 409")
    void registerDuplicateUsername() {
        given(jsonSpec)
                .body(new RegisterRequest("user1", "password123"))
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(409)
                .body(matchesJsonSchemaInClasspath("schemas/error.json"))
                .body("message", equalTo("Username already taken"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a short password with 400 and a field message")
    void registerRejectsShortPassword() {
        given(jsonSpec)
                .body(new RegisterRequest("shortuser", "abc"))
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(400)
                .body(matchesJsonSchemaInClasspath("schemas/error.json"))
                .body("message", containsString("password"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register answers a malformed JSON body with 400, not 401")
    void registerRejectsMalformedJson() {
        given(jsonSpec)
                .body("not json")
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(400)
                .body("message", equalTo("Request body is not valid JSON"));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me returns the profile contract for a bearer token")
    void profileWithBearerToken() {
        String token = AuthApiClient.login("user1", "password1");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/auth/me")
                .then()
                .statusCode(200)
                .body(matchesJsonSchemaInClasspath("schemas/profile.json"))
                .body("username", equalTo("user1"));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me without a token returns 401")
    void profileWithoutToken() {
        given()
                .when()
                .get("/api/auth/me")
                .then()
                .statusCode(401);
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me with a garbage token returns 401")
    void profileWithGarbageToken() {
        given()
                .header("Authorization", "Bearer not-a-jwt")
                .when()
                .get("/api/auth/me")
                .then()
                .statusCode(401);
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/logout returns 204")
    void logoutReturnsNoContent() {
        given()
                .when()
                .post("/api/auth/logout")
                .then()
                .statusCode(204);
    }

    @Test
    @Tag("api")
    @DisplayName("DELETE /api/auth/me removes the account: repeated login is rejected")
    void deleteRemovesAccount() {
        String username = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        String token = AuthApiClient.register(username, "password123");

        AuthApiClient.deleteAccount(token);

        given(jsonSpec)
                .body(new LoginRequest(username, "password123"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", equalTo(WRONG_CREDENTIALS_MESSAGE));
    }

    @Test
    @Tag("api")
    @DisplayName("unmapped /api/* path requires authentication (security catch-all)")
    void unmappedApiPathRequiresAuthentication() {
        given()
                .when()
                .get("/api/nope")
                .then()
                .statusCode(401);
    }
}
