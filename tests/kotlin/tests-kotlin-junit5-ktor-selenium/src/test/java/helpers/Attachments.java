package helpers;

import config.ConfigReader;
import io.qameta.allure.Allure;
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
        Allure.addAttachment(name, "image/png", new ByteArrayInputStream(
                camera.getScreenshotAs(OutputType.BYTES)), "png");
    }

    public static void pageSource() {
        Allure.addAttachment(
                "Page source",
                "text/html",
                WebDriverHolder.get().getPageSource(),
                ".html");
    }

    public static void browserConsoleLogs() {
        WebDriver driver = WebDriverHolder.get();
        try {
            var logs = driver.manage().logs().get(LogType.BROWSER);
            var text = new StringBuilder();
            logs.forEach(entry -> text.append(entry.getLevel()).append(' ').append(entry.getMessage()).append('\n'));
            Allure.addAttachment("Browser console", "text/plain", text.toString(), ".txt");
        } catch (RuntimeException ignored) {
            // Some drivers do not expose browser logs.
        }
    }

    public static void asUtf8(String name, String body) {
        Allure.addAttachment(name, "text/plain", new ByteArrayInputStream(
                body.getBytes(StandardCharsets.UTF_8)), ".txt");
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
            Allure.addAttachment(
                    "Video",
                    "text/html",
                    "<html><body><video width='100%' height='100%' controls autoplay><source src='"
                            + videoUrl
                            + "' type='video/mp4'></video></body></html>",
                    ".html");
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
