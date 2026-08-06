package api;

import tests.AllureMeta;
import config.ConfigReader;
import config.TestConfig;
import io.qameta.allure.Issue;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;

@Issue("REF-3")
public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    @BeforeAll
    static void setupRestAssured() {
        RestAssured.baseURI = ConfigReader.resolveApiBaseUrl();
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
        if (config.logToConsole()) {
            RestAssured.filters(new AllureRestAssured());
        }
    }
}
