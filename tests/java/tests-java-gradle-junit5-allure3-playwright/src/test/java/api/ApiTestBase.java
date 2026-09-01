package api;

import allure.AllureRestAssuredFilters;
import tests.AllureMeta;
import config.ConfigReader;
import config.TestConfig;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    /**
     * JSON request spec for POST/PUT bodies: {@code given(jsonSpec)…}.
     * Built at class load with an explicit base URI — a bare
     * {@code RequestSpecBuilder} spec carries its own default ({@code localhost:8080})
     * and would silently override {@code RestAssured.baseURI}.
     */
    protected static RequestSpecification jsonSpec;

    static {
        RestAssured.baseURI = ConfigReader.resolveApiBaseUrl();
        jsonSpec = new RequestSpecBuilder()
                .setBaseUri(ConfigReader.resolveApiBaseUrl())
                .setContentType(ContentType.JSON)
                .build();
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
        AllureRestAssuredFilters.apply(config);
    }
}
