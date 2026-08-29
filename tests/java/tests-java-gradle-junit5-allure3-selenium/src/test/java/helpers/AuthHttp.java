package helpers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import config.ConfigReader;
import io.qameta.allure.Step;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Fixture plumbing for e2e setup/cleanup. Not the Rest Assured teaching block.
 */
public final class AuthHttp {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private AuthHttp() {
    }

    @Step("API: register user {username}")
    public static String register(String username, String password) {
        var response = send("POST", "/api/auth/register", jsonUser(username, password), null);
        requireStatus(response, 201);
        return tokenOf(response.body());
    }

    @Step("API: login as {username}")
    public static String login(String username, String password) {
        var response = send("POST", "/api/auth/login", jsonUser(username, password), null);
        requireStatus(response, 200);
        return tokenOf(response.body());
    }

    @Step("API: delete current account")
    public static void deleteAccount(String token) {
        var response = send("DELETE", "/api/auth/me", null, token);
        requireStatus(response, 204);
    }

    public static void deleteAccountQuietly(String username, String password) {
        try {
            deleteAccount(login(username, password));
        } catch (RuntimeException ignored) {
            // Cleanup must not mask the original test failure.
        }
    }

    private static String jsonUser(String username, String password) {
        try {
            return MAPPER.writeValueAsString(MAPPER.createObjectNode()
                    .put("username", username)
                    .put("password", password));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static HttpResponse<String> send(String method, String path, String body, String token) {
        try {
            var builder = HttpRequest.newBuilder()
                    .uri(URI.create(ConfigReader.resolveApiBaseUrl()).resolve(path.startsWith("/") ? path.substring(1) : path))
                    .timeout(Duration.ofSeconds(10));
            if (token != null) {
                builder.header("Authorization", "Bearer " + token);
            }
            if (body != null) {
                builder.header("Content-Type", "application/json");
                builder.method(method, HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
            } else {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            }
            return CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Auth HTTP " + method + " " + path + " failed", e);
        }
    }

    private static void requireStatus(HttpResponse<String> response, int expected) {
        if (response.statusCode() != expected) {
            throw new IllegalStateException(
                    "Expected HTTP " + expected + " but got " + response.statusCode() + ": " + response.body());
        }
    }

    private static String tokenOf(String body) {
        try {
            JsonNode token = MAPPER.readTree(body).get("token");
            if (token == null || token.asText().isBlank()) {
                throw new IllegalStateException("Auth response has no token: " + body);
            }
            return token.asText();
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Cannot parse auth token from: " + body, e);
        }
    }
}
