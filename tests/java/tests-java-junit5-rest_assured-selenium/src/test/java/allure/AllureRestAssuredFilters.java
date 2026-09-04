package allure;

import config.TestConfig;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import io.restassured.filter.Filter;

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

    public static void apply(TestConfig config) {
        if (!isEnabled(config)) {
            return;
        }
        for (Filter filter : RestAssured.filters()) {
            if (filter instanceof AllureRestAssured) {
                return;
            }
        }
        RestAssured.filters(create(config));
    }
}
