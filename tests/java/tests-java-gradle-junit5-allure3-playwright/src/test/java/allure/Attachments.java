package allure;

import helpers.HarCapture;
import helpers.HarViewerHtml;
import io.qameta.allure.Allure;
import java.io.ByteArrayInputStream;
import java.nio.file.Path;
import java.util.Optional;

public final class Attachments {

    private Attachments() {
    }

    /**
     * Attach client-side HAR: raw {@code capture.har} plus a self-contained HTML
     * table viewer. No-op when capture produced nothing — never throws.
     */
    public static void harLogs(Path harPath) {
        try {
            Optional<byte[]> har = HarCapture.collectHarJson(harPath);
            har.ifPresent(bytes -> {
                Allure.addAttachment(
                        "capture.har",
                        "application/json",
                        new ByteArrayInputStream(bytes),
                        ".har");
                Allure.addAttachment(
                        "HAR Viewer",
                        "text/html",
                        HarViewerHtml.render(bytes),
                        ".html");
            });
        } catch (RuntimeException ignored) {
            // dead session or Allure I/O — skip, never mask the test failure
        }
    }
}
