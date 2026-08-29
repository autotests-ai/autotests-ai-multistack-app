package allure;

import config.TestConfig;
import io.qameta.allure.okhttp3.AllureOkHttp3;
import okhttp3.OkHttpClient;

/**
 * Allure HTTP attachments for Retrofit 2 (OkHttp interceptor).
 * Reuses {@code enableAllureRestAssuredListener} so ci.properties stays the same switch as the RA sibling.
 */
public final class AllureOkHttp {

    private AllureOkHttp() {
    }

    public static boolean isEnabled(TestConfig config) {
        return !"none".equals(config.allureReportMode()) && config.enableAllureRestAssuredListener();
    }

    public static OkHttpClient client(TestConfig config) {
        var builder = new OkHttpClient.Builder();
        if (isEnabled(config)) {
            builder.addInterceptor(new AllureOkHttp3());
        }
        return builder.build();
    }
}
