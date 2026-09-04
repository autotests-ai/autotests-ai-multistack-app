package allure;

import config.TestConfig;
import io.qameta.allure.Allure;

public final class AllureApiRequest {

    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String REQUEST_TEMPLATE = "request.ftl";
    /** Classpath name under {@code tpl/}; keep in sync with {@code helpers.AllureHttpHtml}. */
    public static final String RESPONSE_TEMPLATE = "response.ftl";

    private AllureApiRequest() {
    }

    public static boolean isEnabled(TestConfig config) {
        return !"none".equals(config.allureReportMode()) && config.enableAllureRestAssuredListener();
    }

    public static void attach(TestConfig config, String method, String url, int status, String body) {
        if (!isEnabled(config)) {
            return;
        }
        try {
            Allure.addAttachment("Request", "text/plain", method + " " + url);
            Allure.addAttachment("Response", "text/plain", status + "\n" + (body == null ? "" : body));
        } catch (RuntimeException ignored) {
            // Allure context is optional; never mask the HTTP call.
        }
    }
}
