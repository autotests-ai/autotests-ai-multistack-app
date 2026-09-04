package api;

import api.model.LoginRequest;
import api.model.RegisterRequest;
import io.qameta.allure.Step;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Thin Retrofit client for test setup and cleanup.
 */
public final class AuthApiClient {

    private AuthApiClient() {
    }

    @Step("API: register user {username}")
    public static String register(String username, String password) {
        var response = Calls.execute(ApiTestBase.api.register(new RegisterRequest(username, password)));
        assertEquals(201, response.code());
        assertNotNull(response.body());
        return response.body().token();
    }

    @Step("API: login as {username}")
    public static String login(String username, String password) {
        var response = Calls.execute(ApiTestBase.api.login(new LoginRequest(username, password)));
        assertEquals(200, response.code());
        assertNotNull(response.body());
        return response.body().token();
    }

    @Step("API: delete current account")
    public static void deleteAccount(String token) {
        var response = Calls.execute(ApiTestBase.api.deleteMe("Bearer " + token));
        assertEquals(204, response.code());
    }

    public static void deleteAccountQuietly(String username, String password) {
        try {
            deleteAccount(login(username, password));
        } catch (AssertionError | RuntimeException ignored) {
            // Cleanup must not mask the original test failure.
        }
    }
}
