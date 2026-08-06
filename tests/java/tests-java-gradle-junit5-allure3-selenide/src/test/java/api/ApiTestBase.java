package api;

import config.ConfigReader;
import config.TestConfig;
import io.qameta.allure.Issue;
import io.qameta.allure.restassured.AllureRestAssured;
import io.qameta.allure.Owner;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;

@Owner("reference-app")
@Issue("REF-3")
public class ApiTestBase {

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
