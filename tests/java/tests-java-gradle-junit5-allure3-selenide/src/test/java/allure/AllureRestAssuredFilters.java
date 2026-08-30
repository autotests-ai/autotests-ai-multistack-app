package allure;

import config.TestConfig;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;

import java.util.concurrent.atomic.AtomicBoolean;

public final class AllureRestAssuredFilters {

    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String REQUEST_TEMPLATE = "request.ftl";
    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String RESPONSE_TEMPLATE = "response.ftl";

    private static final AtomicBoolean INSTALLED = new AtomicBoolean();

    private AllureRestAssuredFilters() {
    }

    public static boolean isEnabled(TestConfig config) {
        return !"none".equals(config.allureReportMode()) && config.enableAllureRestAssuredListener();
    }

    public static AllureRestAssured create(TestConfig config) {
        AllureRestAssured filter = new AllureRestAssured();
        if ("colored".equalsIgnoreCase(config.allureRestAssuredListenerStyle())) {
            filter.setRequestTemplate(REQUEST_TEMPLATE);
            filter.setResponseTemplate(RESPONSE_TEMPLATE);
        }
        return filter;
    }

    /**
     * Install once. {@code RestAssured.filters()} replaces the global list; JUnit parallel
     * {@code @BeforeAll} on several API classes used to clear it mid-request (NPE on filter()).
     */
    public static void apply(TestConfig config) {
        if (!isEnabled(config)) {
            return;
        }
        if (!INSTALLED.compareAndSet(false, true)) {
            return;
        }
        RestAssured.filters(create(config));
    }
}
