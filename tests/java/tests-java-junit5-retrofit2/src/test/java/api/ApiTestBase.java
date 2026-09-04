package api;

import allure.AllureOkHttp;
import annotations.Framework;
import config.ConfigReader;
import config.TestConfig;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;
import tests.AllureMeta;
import org.junit.jupiter.api.BeforeAll;

@Framework("retrofit2")
public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    protected static ReferenceApi api;

    @BeforeAll
    static void setupRetrofit() {
        api = new Retrofit.Builder()
                .baseUrl(ConfigReader.resolveApiBaseUrl())
                .client(AllureOkHttp.client(config))
                .addConverterFactory(JacksonConverterFactory.create())
                .build()
                .create(ReferenceApi.class);
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }
}
