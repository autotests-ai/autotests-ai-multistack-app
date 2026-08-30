package allure;

import config.TestConfig;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.builder.RequestSpecBuilder;

public final class AllureRestAssuredFilters {

    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String REQUEST_TEMPLATE = "request.ftl";
    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String RESPONSE_TEMPLATE = "response.ftl";

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

    /** Per-spec, not {@code RestAssured.filters()} — that global list is not parallel-safe. */
    public static void addTo(RequestSpecBuilder builder, TestConfig config) {
        if (isEnabled(config)) {
            builder.addFilter(create(config));
        }
    }
}
