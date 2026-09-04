package helpers;

import allure.AllureApiRequest;
import io.qameta.allure.attachment.FreemarkerAttachmentRenderer;
import io.qameta.allure.attachment.http.HttpRequestAttachment;
import io.qameta.allure.attachment.http.HttpResponseAttachment;

/**
 * Renders colored Allure HTTP HTML from {@code tpl/*.ftl}.
 * <p>
 * Unit-test the template, then copy to {@code _tests-meta}. Do not iterate via
 * a full {@code allureReport} first.
 */
public final class AllureHttpHtml {

    private AllureHttpHtml() {
    }

    public static String renderRequest(HttpRequestAttachment data) {
        return new FreemarkerAttachmentRenderer(AllureApiRequest.REQUEST_TEMPLATE)
                .render(data)
                .getContent();
    }

    public static String renderResponse(HttpResponseAttachment data) {
        return new FreemarkerAttachmentRenderer(AllureApiRequest.RESPONSE_TEMPLATE)
                .render(data)
                .getContent();
    }
}
