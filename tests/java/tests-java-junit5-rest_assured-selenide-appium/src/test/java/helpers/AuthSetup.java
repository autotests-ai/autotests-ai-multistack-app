package helpers;

import config.TestConfig;
import io.qameta.allure.Step;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.aeonbits.owner.ConfigFactory;

import java.util.Map;

import static io.restassured.RestAssured.given;

public final class AuthSetup {

    private AuthSetup() {
    }

    @Step("API: register user {username}")
    public static void register(String username, String password) {
        useApi();
        given()
                .contentType(ContentType.JSON)
                .body(Map.of("username", username, "password", password))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(201);
    }

    @Step("API: login as {username}")
    public static void login(String username, String password) {
        useApi();
        given()
                .contentType(ContentType.JSON)
                .body(Map.of("username", username, "password", password))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200);
    }

    public static void deleteAccountQuietly(String username, String password) {
        try {
            useApi();
            String token = given()
                    .contentType(ContentType.JSON)
                    .body(Map.of("username", username, "password", password))
                    .when()
                    .post("/auth/login")
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("token");
            given()
                    .header("Authorization", "Bearer " + token)
                    .when()
                    .delete("/auth/me");
        } catch (AssertionError | RuntimeException ignored) {
            // The test that created the user owns assertions; cleanup must not re-fail it.
        }
    }

    private static void useApi() {
        TestConfig config = ConfigFactory.create(TestConfig.class, System.getProperties());
        String apiBase = config.apiBase();
        if (apiBase == null || apiBase.isBlank()) {
            throw new IllegalStateException("Set apiBase in config/${env}.properties");
        }
        RestAssured.baseURI = apiBase.endsWith("/") ? apiBase.substring(0, apiBase.length() - 1) : apiBase;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }
}
