package api;

import tests.AllureMeta;
import config.ConfigReader;
import config.TestConfig;
import io.restassured.RestAssured;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.BeforeAll;

public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    /** Per-request spec: {@code given(jsonSpec())}. */
    protected static RequestSpecification jsonSpec() {
        return ApiSpecs.json();
    }

    @BeforeAll
    static void logFailedHttp() {
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }
}
