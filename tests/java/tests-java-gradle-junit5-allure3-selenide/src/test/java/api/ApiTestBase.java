package api;

import allure.AllureRestAssuredFilters;
import tests.AllureMeta;
import config.ConfigReader;
import config.TestConfig;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.BeforeAll;

public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    /**
     * JSON request spec for POST/PUT bodies: {@code given(jsonSpec)…}.
     * Built in {@link #setupRestAssured()} with an explicit base URI — a bare
     * {@code RequestSpecBuilder} spec carries its own default ({@code localhost:8080})
     * and would silently override {@code RestAssured.baseURI}.
     */
    protected static RequestSpecification jsonSpec;

    private static final Object REST_ASSURED_SETUP = new Object();
    private static volatile boolean restAssuredReady;

    @BeforeAll
    static void setupRestAssured() {
        synchronized (REST_ASSURED_SETUP) {
            if (restAssuredReady) {
                return;
            }
            RestAssured.baseURI = ConfigReader.resolveApiBaseUrl();
            jsonSpec = new RequestSpecBuilder()
                    .setBaseUri(ConfigReader.resolveApiBaseUrl())
                    .setContentType(ContentType.JSON)
                    .build();
            RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
            AllureRestAssuredFilters.apply(config);
            restAssuredReady = true;
        }
    }
}
