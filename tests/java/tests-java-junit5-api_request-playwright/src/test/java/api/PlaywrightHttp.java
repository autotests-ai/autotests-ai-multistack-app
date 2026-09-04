package api;

import allure.AllureApiRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.RequestOptions;
import config.ConfigReader;
import config.TestConfig;

import java.util.Locale;

/**
 * Shared Playwright {@code APIRequestContext} against {@link ConfigReader#resolveApiBaseUrl()}.
 */
public final class PlaywrightHttp {

    public static final String WRONG_CREDENTIALS_MESSAGE = "Wrong login or password";

    private static final Object GATE = new Object();

    private static Playwright playwright;
    private static APIRequestContext api;
    private static String origin = "";
    private static TestConfig config;

    private PlaywrightHttp() {
    }

    public static void setup(TestConfig testConfig) {
        synchronized (GATE) {
            if (api != null) {
                return;
            }
            config = testConfig;
            origin = ConfigReader.resolveApiBaseUrl().replaceAll("/$", "");
            playwright = Playwright.create();
            api = playwright.request().newContext(new APIRequest.NewContextOptions()
                    .setBaseURL(origin)
                    .setTimeout(10_000)
                    .setIgnoreHTTPSErrors(true));
            Runtime.getRuntime().addShutdownHook(new Thread(PlaywrightHttp::close));
        }
    }

    public static void ensure() {
        setup(ConfigReader.testConfig);
    }

    public static HttpResult request(String method, String path, Object json, String raw, String token) {
        ensure();
        RequestOptions options = RequestOptions.create();
        if (token != null) {
            options.setHeader("Authorization", "Bearer " + token);
        }
        if (json != null) {
            options.setHeader("Content-Type", "application/json");
            try {
                options.setData(HttpResult.MAPPER.writeValueAsString(json));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException(e);
            }
        } else if (raw != null) {
            options.setHeader("Content-Type", "application/json");
            options.setData(raw);
        }
        String verb = method.toUpperCase(Locale.ROOT);
        String urlPath = pathOf(path);
        APIResponse response = switch (verb) {
            case "GET" -> api.get(urlPath, options);
            case "POST" -> api.post(urlPath, options);
            case "PUT" -> api.put(urlPath, options);
            case "DELETE" -> api.delete(urlPath, options);
            default -> throw new IllegalArgumentException(verb);
        };
        try {
            int status = response.status();
            String body = response.text();
            AllureApiRequest.attach(config, verb, origin + urlPath, status, body);
            return new HttpResult(status, body);
        } finally {
            response.dispose();
        }
    }

    public static HttpResult request(String method, String path) {
        return request(method, path, null, null, null);
    }

    public static HttpResult request(String method, String path, Object json) {
        return request(method, path, json, null, null);
    }

    public static HttpResult request(String method, String path, String token) {
        return request(method, path, null, null, token);
    }

    static void close() {
        synchronized (GATE) {
            if (api != null) {
                api.dispose();
                api = null;
            }
            if (playwright != null) {
                playwright.close();
                playwright = null;
            }
        }
    }

    private static String pathOf(String path) {
        return path.startsWith("/") ? path : "/" + path;
    }
}
