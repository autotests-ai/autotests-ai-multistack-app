package allure;

import com.microsoft.playwright.Page;
import helpers.HarCapture;
import helpers.HarViewerHtml;
import helpers.SelenoidPlaywrightEndpoint;
import io.qameta.allure.Allure;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

public final class Attachments {

    private Attachments() {
    }

    public static void screenshot(Page page, String name) {
        try {
            Allure.addAttachment(
                    name,
                    "image/png",
                    new ByteArrayInputStream(page.screenshot()),
                    "png");
        } catch (RuntimeException ignored) {
            // dead session — skip, never mask the test failure
        }
    }

    public static void pageSource(Page page) {
        try {
            Allure.addAttachment("Page source", "text/html", page.content(), ".html");
        } catch (RuntimeException ignored) {
            // dead session — skip, never mask the test failure
        }
    }

    public static void browserConsoleLogs(String text) {
        if (text == null || text.isBlank()) {
            return;
        }
        try {
            Allure.addAttachment("Browser console", "text/plain", text, ".txt");
        } catch (RuntimeException ignored) {
            // Allure I/O — skip, never mask the test failure
        }
    }

    /**
     * Local Playwright {@code recordVideoDir} file (laptop / mock, not the hub).
     */
    public static void video(Path dir) {
        if (dir == null || !Files.isDirectory(dir)) {
            return;
        }
        try (var walk = Files.walk(dir)) {
            walk.filter(path -> {
                var name = path.getFileName().toString();
                return name.endsWith(".webm") || name.endsWith(".mp4");
            }).findFirst().ifPresent(file -> {
                try {
                    Allure.addAttachment(
                            "Video",
                            "video/webm",
                            new ByteArrayInputStream(Files.readAllBytes(file)),
                            ".webm");
                } catch (IOException ignored) {
                    // temp video is best-effort
                }
            });
        } catch (IOException ignored) {
            // temp video is best-effort
        }
    }

    /**
     * Selenoid hub video — same HTML player as the Selenide cell:
     * {@code videoFolder}/{videoName}. Playwright {@code connect()} has no WebDriver
     * session id; {@code videoName} is the query param sent on the WS connect.
     */
    public static void video(String videoFolder, String videoName) {
        var videoUrl = SelenoidPlaywrightEndpoint.videoUrl(videoFolder, videoName);
        if (videoUrl.isEmpty()) {
            return;
        }
        try {
            Allure.addAttachment(
                    "Video",
                    "text/html",
                    "<html><body><video width='100%' height='100%' controls autoplay><source src='"
                            + videoUrl
                            + "' type='video/mp4'></video></body></html>",
                    ".html");
        } catch (RuntimeException ignored) {
            // Allure I/O — skip, never mask the test failure
        }
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
