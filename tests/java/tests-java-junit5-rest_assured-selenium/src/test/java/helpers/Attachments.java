package helpers;

import config.ConfigReader;
import io.qameta.allure.Allure;
import io.qameta.allure.AttachmentOptions;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public final class Attachments {

    private Attachments() {
    }

    public static void screenshot(String name) {
        if (!(WebDriverHolder.get() instanceof TakesScreenshot camera)) {
            return;
        }
        Allure.attachment(name, "image/png", new ByteArrayInputStream(
                camera.getScreenshotAs(OutputType.BYTES)), AttachmentOptions.withFileExtension(".png"));
    }

    public static void pageSource() {
        Allure.attachment(
                "Page source",
                "text/html",
                WebDriverHolder.get().getPageSource(), AttachmentOptions.withFileExtension(".html"));
    }

    public static void browserConsoleLogs() {
        WebDriver driver = WebDriverHolder.get();
        try {
            var logs = driver.manage().logs().get(LogType.BROWSER);
            var text = new StringBuilder();
            logs.forEach(entry -> text.append(entry.getLevel()).append(' ').append(entry.getMessage()).append('\n'));
            Allure.attachment("Browser console", "text/plain", text.toString(), AttachmentOptions.withFileExtension(".txt"));
        } catch (RuntimeException ignored) {
            // Some drivers do not expose browser logs.
        }
    }

    public static void asUtf8(String name, String body) {
        Allure.attachment(name, "text/plain", new ByteArrayInputStream(
                body.getBytes(StandardCharsets.UTF_8)), AttachmentOptions.withFileExtension(".txt"));
    }

    public static void video() {
        if (!WebDriverHolder.has()) {
            return;
        }
        var folder = ConfigReader.testConfig.videoFolder();
        if (folder == null || folder.isBlank()) {
            return;
        }
        if (!(WebDriverHolder.get() instanceof RemoteWebDriver remote)) {
            return;
        }
        var sessionId = remote.getSessionId();
        if (sessionId == null) {
            return;
        }
        try {
            var base = folder.endsWith("/") ? folder : folder + "/";
            var videoUrl = base + sessionId + ".mp4";
            Allure.attachment(
                    "Video",
                    "text/html",
                    "<html><body><video width='100%' height='100%' controls autoplay><source src='"
                            + videoUrl
                            + "' type='video/mp4'></video></body></html>", AttachmentOptions.withFileExtension(".html"));
        } catch (RuntimeException ignored) {
            // dead session — skip, never mask the test failure
        }
    }

    /**
     * Attach client-side HAR plus a self-contained HTML viewer. No-op when capture
     * produced nothing — never throws.
     */
    public static void harLogs() {
        if (!WebDriverHolder.has() || !HarCapture.supportsBrowser(ConfigReader.testConfig.browser())) {
            return;
        }
        try {
            HarCapture.collectHarJson().ifPresent(bytes -> {
                Allure.attachment(
                        "capture.har",
                        "application/json",
                        new ByteArrayInputStream(bytes), AttachmentOptions.withFileExtension(".har"));
                Allure.attachment(
                        "HAR Viewer",
                        "text/html",
                        HarViewerHtml.render(bytes), AttachmentOptions.withFileExtension(".html"));
            });
        } catch (RuntimeException ignored) {
            // dead session or Allure I/O — skip, never mask the test failure
        }
    }
}
