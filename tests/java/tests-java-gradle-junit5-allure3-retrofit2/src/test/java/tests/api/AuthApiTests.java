package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.AuthApiClient;
import api.Calls;
import api.RawJson;
import api.model.LoginRequest;
import api.model.RegisterRequest;
import helpers.DataFaker;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import retrofit2.Response;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * HTTP contract of {@code /api/auth/*}: status codes, typed bodies, error envelopes.
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
        var response = Calls.execute(api.login(new LoginRequest("user1", "password1")));
        assertEquals(200, response.code());
        var body = response.body();
        assertNotNull(body);
        assertEquals("user1", body.username());
        assertEquals("/", body.redirectUrl());
        assertNotNull(body.token());
        assertFalse(body.token().isBlank());
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login rejects a wrong password with 401")
    void loginWithInvalidPassword() {
        var response = Calls.execute(api.login(new LoginRequest("user1", "wrongpassword")));
        assertEquals(401, response.code());
        assertEquals(WRONG_CREDENTIALS_MESSAGE, Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")
    void loginWithUnknownUsername() {
        var response = Calls.execute(api.login(new LoginRequest(DataFaker.username(), "password123")));
        assertEquals(401, response.code());
        assertEquals(WRONG_CREDENTIALS_MESSAGE, Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login joins both field errors into one 400 message")
    void loginRejectsEmptyCredentials() {
        var response = Calls.execute(api.login(new LoginRequest("", "")));
        assertEquals(400, response.code());
        var message = Calls.errorMessage(response);
        assertTrue(message.contains("username"));
        assertTrue(message.contains("password"));
        assertTrue(message.contains("; "));
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects a short username with 400")
    void loginRejectsShortUsername() {
        assertErrorContains(Calls.execute(api.login(new LoginRequest("ab", "password1"))), 400, "username");
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects a short password with 400")
    void loginRejectsShortPassword() {
        assertErrorContains(Calls.execute(api.login(new LoginRequest("user1", "123"))), 400, "password");
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects an empty username with 400")
    void loginRejectsEmptyUsername() {
        assertErrorContains(Calls.execute(api.login(new LoginRequest("", "password1"))), 400, "username");
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login rejects an empty password with 400")
    void loginRejectsEmptyPassword() {
        assertErrorContains(Calls.execute(api.login(new LoginRequest("user1", ""))), 400, "password");
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("POST /api/auth/login answers a malformed JSON body with 400, not 401")
    void loginRejectsMalformedJson() {
        var response = Calls.execute(api.loginRaw(RawJson.body("not json")));
        assertEquals(400, response.code());
        assertEquals("Request body is not valid JSON", Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register creates a user, returns the auth contract, and cleans up")
    void registerNewUser() {
        String username = DataFaker.username();

        var response = Calls.execute(api.register(new RegisterRequest(username, "password123")));
        assertEquals(201, response.code());
        var body = response.body();
        assertNotNull(body);
        assertEquals(username, body.username());
        assertEquals("/", body.redirectUrl());
        assertNotNull(body.token());
        assertFalse(body.token().isBlank());

        AuthApiClient.deleteAccount(body.token());
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a duplicate username with 409")
    void registerDuplicateUsername() {
        var response = Calls.execute(api.register(new RegisterRequest("user1", "password123")));
        assertEquals(409, response.code());
        assertEquals("Username already taken", Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a short password with 400")
    void registerRejectsShortPassword() {
        assertErrorContains(Calls.execute(api.register(new RegisterRequest("shortuser", "abc"))), 400, "password");
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects a short username with 400")
    void registerRejectsShortUsername() {
        assertErrorContains(Calls.execute(api.register(new RegisterRequest("ab", "password123"))), 400, "username");
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects an empty username with 400")
    void registerRejectsEmptyUsername() {
        assertErrorContains(Calls.execute(api.register(new RegisterRequest("", "password123"))), 400, "username");
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects an empty password with 400")
    void registerRejectsEmptyPassword() {
        assertErrorContains(Calls.execute(api.register(new RegisterRequest("newuser", ""))), 400, "password");
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register joins both field errors into one 400 message")
    void registerRejectsEmptyCredentials() {
        var response = Calls.execute(api.register(new RegisterRequest("", "")));
        assertEquals(400, response.code());
        var message = Calls.errorMessage(response);
        assertTrue(message.contains("username"));
        assertTrue(message.contains("password"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register answers a malformed JSON body with 400, not 401")
    void registerRejectsMalformedJson() {
        var response = Calls.execute(api.registerRaw(RawJson.body("not json")));
        assertEquals(400, response.code());
        assertEquals("Request body is not valid JSON", Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me returns the profile contract for a bearer token")
    void profileWithBearerToken() {
        String token = AuthApiClient.login("user1", "password1");

        var response = Calls.execute(api.me(bearer(token)));
        assertEquals(200, response.code());
        var body = response.body();
        assertNotNull(body);
        assertEquals("user1", body.username());
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me without a token returns 401")
    void profileWithoutToken() {
        assertEquals(401, Calls.execute(api.me()).code());
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me with a garbage token returns 401")
    void profileWithGarbageToken() {
        assertEquals(401, Calls.execute(api.me(bearer("not-a-jwt"))).code());
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/logout returns 204")
    void logoutReturnsNoContent() {
        assertEquals(204, Calls.execute(api.logout()).code());
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("DELETE /api/auth/me without a token returns 401")
    void deleteWithoutToken() {
        assertEquals(401, Calls.execute(api.deleteMe()).code());
    }

    @Test
    @Tag("api")
    @Tag("negative")
    @DisplayName("DELETE /api/auth/me with a garbage token returns 401")
    void deleteWithGarbageToken() {
        assertEquals(401, Calls.execute(api.deleteMe(bearer("not-a-jwt"))).code());
    }

    @Test
    @Tag("api")
    @DisplayName("DELETE /api/auth/me removes the account: repeated login is rejected")
    void deleteRemovesAccount() {
        String username = DataFaker.username();
        String token = AuthApiClient.register(username, "password123");

        AuthApiClient.deleteAccount(token);

        var response = Calls.execute(api.login(new LoginRequest(username, "password123")));
        assertEquals(401, response.code());
        assertEquals(WRONG_CREDENTIALS_MESSAGE, Calls.errorMessage(response));
    }

    @Test
    @Tag("api")
    @DisplayName("unmapped /api/* path requires authentication (security catch-all)")
    void unmappedApiPathRequiresAuthentication() {
        assertEquals(401, Calls.execute(api.unmapped()).code());
    }

    private static void assertErrorContains(Response<?> response, int status, String fragment) {
        assertEquals(status, response.code());
        assertTrue(Calls.errorMessage(response).contains(fragment));
    }
}
