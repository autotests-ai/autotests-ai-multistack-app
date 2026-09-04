package helpers;

import io.qameta.allure.Step;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fixture calls against the same live {@code /api} the APK talks to.
 * Not the 31-test API catalog — that stays in the web Selenide cell.
 */
public final class AuthSetup {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private static final Pattern TOKEN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    private AuthSetup() {
    }

    @Step("API: register user {username}")
    public static void register(String username, String password) {
        HttpResponse<String> response = send("POST", "/auth/register", json(username, password), null);
        if (response.statusCode() != 201) {
            throw new IllegalStateException(
                    "register failed: " + response.statusCode() + " " + response.body());
        }
    }

    @Step("API: login as {username}")
    public static void login(String username, String password) {
        HttpResponse<String> response = send("POST", "/auth/login", json(username, password), null);
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "login failed: " + response.statusCode() + " " + response.body());
        }
    }

    /** Best-effort cleanup: must not mask the original test failure. */
    public static void deleteAccountQuietly(String username, String password) {
        try {
            HttpResponse<String> login = send("POST", "/auth/login", json(username, password), null);
            if (login.statusCode() != 200) {
                return;
            }
            Matcher matcher = TOKEN.matcher(login.body());
            if (!matcher.find()) {
                return;
            }
            send("DELETE", "/auth/me", null, matcher.group(1));
        } catch (RuntimeException ignored) {
            // The test that created the user owns assertions; cleanup must not re-fail it.
        }
    }

    private static String apiBase() {
        String fromEnv = System.getenv("API_BASE");
        if (fromEnv != null && !fromEnv.isBlank()) {
            return stripSlash(fromEnv);
        }
        return "https://autotests.ai/stack/backend-java-spring/api";
    }

    private static HttpResponse<String> send(String method, String path, String body, String token) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase() + path))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json");
            if (token != null) {
                builder.header("Authorization", "Bearer " + token);
            }
            if (body != null) {
                builder.header("Content-Type", "application/json");
                builder.method(method, HttpRequest.BodyPublishers.ofString(body));
            } else {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            }
            return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new IllegalStateException("HTTP " + method + " " + path + " failed", e);
        }
    }

    private static String json(String username, String password) {
        return "{\"username\":" + quote(username) + ",\"password\":" + quote(password) + "}";
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String stripSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
