package helpers;

import config.ConfigReader;
import io.qameta.allure.Step;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * WireMock scenario switch for the mock stand. Java HttpClient — this UI block has no Rest Assured.
 */
public final class MockScenarios {

    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    private MockScenarios() {
    }

    public static boolean available() {
        try {
            var response = CLIENT.send(request("GET", "/__admin/scenarios", null), HttpResponse.BodyHandlers.discarding());
            return response.statusCode() == 200;
        } catch (Exception gatewayUnreachable) {
            return false;
        }
    }

    @Step("Mock: switch scenario {scenario} to state {state}")
    public static void setState(String scenario, String state) {
        var response = send("PUT", "/__admin/scenarios/" + scenario + "/state", "{\"state\":\"" + state + "\"}");
        if (response.statusCode() != 200) {
            throw new IllegalStateException("WireMock setState HTTP " + response.statusCode());
        }
    }

    @Step("Mock: reset all scenarios")
    public static void resetAll() {
        var response = send("POST", "/__admin/scenarios/reset", null);
        if (response.statusCode() != 200) {
            throw new IllegalStateException("WireMock reset HTTP " + response.statusCode());
        }
    }

    private static HttpResponse<Void> send(String method, String path, String json) {
        try {
            return CLIENT.send(request(method, path, json), HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static HttpRequest request(String method, String path, String json) {
        var uri = URI.create(ConfigReader.resolveApiBaseUrl().replaceAll("/+$", "") + path);
        var builder = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5));
        if (json != null) {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(json));
        } else if ("POST".equals(method) || "PUT".equals(method)) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.GET();
        }
        return builder.build();
    }
}
