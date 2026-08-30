package api;

import allure.AllureRestAssuredFilters;
import config.ConfigReader;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

/**
 * Rest Assured spec for one request: base URI, JSON, Allure filter.
 * Do not set {@code RestAssured.baseURI} / {@code RestAssured.filters()} — those
 * statics race under JUnit parallel.
 */
public final class ApiSpecs {

    private ApiSpecs() {
    }

    public static RequestSpecification json() {
        var builder = new RequestSpecBuilder()
                .setBaseUri(ConfigReader.resolveApiBaseUrl())
                .setContentType(ContentType.JSON);
        AllureRestAssuredFilters.addTo(builder, ConfigReader.testConfig);
        return builder.build();
    }
}
