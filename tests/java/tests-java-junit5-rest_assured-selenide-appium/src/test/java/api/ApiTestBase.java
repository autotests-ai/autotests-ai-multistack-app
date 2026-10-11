package api;

import annotations.Framework;
import config.ConfigReader;
import config.TestConfig;
import io.restassured.RestAssured;

/**
 * Rest Assured globals ({@code baseURI} on {@code apiBase}) — not a dump request spec.
 * A spec is for a handle (path, auth, expected status), not Content-Type JSON.
 */
@Framework("rest-assured")
public class ApiTestBase {

    protected static final TestConfig config;

    static {
        if (blank(System.getProperty("env"))) {
            System.setProperty("env", "prod");
        }
        config = ConfigReader.testConfig;
        String apiBase = config.apiBase();
        if (blank(apiBase)) {
            throw new IllegalStateException("Set apiBase in config/${env}.properties");
        }
        RestAssured.baseURI = apiBase.endsWith("/") ? apiBase.substring(0, apiBase.length() - 1) : apiBase;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    /** Forces class initialization so helpers see the same Rest Assured globals. */
    static void useRestAssured() {
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
