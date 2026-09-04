package api;

import api.model.LoginRequest;
import api.model.RegisterRequest;
import io.qameta.allure.Step;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Thin API client for test setup and cleanup. API and e2e tests use it to arrange
 * state through the product API instead of duplicating raw JSON strings.
 *
 * <p>Uses Playwright {@code APIRequest} via {@link PlaywrightHttp}.
 */
public final class AuthApiClient {

    private AuthApiClient() {
    }

    @Step("API: register user {username}")
    public static String register(String username, String password) {
        HttpResult response = PlaywrightHttp.request("POST", "/api/auth/register",
                new RegisterRequest(username, password));
        assertEquals(201, response.status(), response.body());
        String token = response.text("token");
        assertFalse(token.isBlank(), response.body());
        return token;
    }

    @Step("API: login as {username}")
    public static String login(String username, String password) {
        HttpResult response = PlaywrightHttp.request("POST", "/api/auth/login",
                new LoginRequest(username, password));
        assertEquals(200, response.status(), response.body());
        String token = response.text("token");
        assertFalse(token.isBlank(), response.body());
        return token;
    }

    @Step("API: delete current account")
    public static void deleteAccount(String token) {
        HttpResult response = PlaywrightHttp.request("DELETE", "/api/auth/me", token);
        assertEquals(204, response.status(), response.body());
    }

    /** Cleanup that must not mask the original test failure: logs in and deletes, best-effort. */
    public static void deleteAccountQuietly(String username, String password) {
        try {
            deleteAccount(login(username, password));
        } catch (AssertionError | RuntimeException ignored) {
            // The test that created the user is responsible for its own assertions;
            // a failed cleanup (user never created, stand down) must not re-fail it.
        }
    }
}
