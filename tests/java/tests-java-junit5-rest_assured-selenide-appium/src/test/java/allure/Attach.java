package allure;

import com.codeborne.selenide.WebDriverRunner;
import config.ConfigReader;
import config.TestConfig;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.screenrecording.CanRecordScreen;
import io.qameta.allure.Allure;
import io.qameta.allure.AttachmentOptions;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.logging.LogEntries;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.SessionId;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Set;

import static com.codeborne.selenide.Selenide.closeWebDriver;

/**
 * Allure attachments, host-agnostic. Every test base calls the same three
 * lifecycle hooks; this class maps them to whatever the current session can
 * produce:
 *
 *   local mobile → screen recording (mp4)
 *   farm mobile  → screenshot + post-session artifacts
 *   local web    → screenshot
 *   web hub      → screenshot + selenoid video when enableVideo=true
 *
 * Each kind is toggled by its own config flag: attachLastScreenshot,
 * attachPageSource, attachDriverLogs (logcat/syslog on devices, browser
 * console on chrome, the appium/driver server log), attachVideo.
 *
 * Everything here works on the LIVE driver (via WebDriverRunner); post-session
 * fetches are delegated to {@link SessionArtifacts}.
 */
public class Attach {

    private boolean mobile;
    private boolean recording;

    // ---- lifecycle hooks -------------------------------------------------

    /** After the session starts: remembers the kind, starts recording on local mobile. */
    public void beforeTest() {
        WebDriver driver = driver();
        mobile = driver instanceof AppiumDriver;
        if (!farm() && config().attachVideo() && driver instanceof CanRecordScreen recorder) {
            try {
                recorder.startRecordingScreen();
                recording = true;
            } catch (RuntimeException ignored) {
                // recording is best-effort — it must never fail the test
            }
        }
    }

    /** In @AfterEach: live artifacts (each by its flag) → closeWebDriver → post-session. */
    public void afterTest() {
        String sessionId = sessionId();
        TestConfig config = config();
        try {
            if (recording) {
                recording = false;
                stopScreenRecording("Video");
            } else if (config.attachLastScreenshot()) {
                screenshot("Screenshot");
            }
            if (config.attachPageSource()) {
                pageSource("Page source");
            }
            if (config.attachDriverLogs()) {
                driverLogs();
            }
        } finally {
            closeWebDriver();
        }
        try {
            sessionArtifacts(sessionId, config);
        } catch (RuntimeException ignored) {
            // artifact fetching is best-effort — it must never mask the test result
        }
    }

    // ---- live driver -----------------------------------------------------

    private static void screenshot(String name) {
        if (driver() instanceof TakesScreenshot takesScreenshot) {
            try {
                byte[] png = takesScreenshot.getScreenshotAs(OutputType.BYTES);
                Allure.attachment(name, "image/png", new ByteArrayInputStream(png),
                        AttachmentOptions.withFileExtension(".png"));
            } catch (RuntimeException ignored) {
                // a dead session must not leak closeWebDriver() or farm artifacts
            }
        }
    }

    /** UI hierarchy XML on devices, DOM HTML on web. */
    private static void pageSource(String name) {
        WebDriver driver = driver();
        if (driver == null) {
            return;
        }
        try {
            boolean xml = driver instanceof AppiumDriver;
            Allure.attachment(name, xml ? "text/xml" : "text/html",
                    new ByteArrayInputStream(driver.getPageSource()
                            .getBytes(StandardCharsets.UTF_8)),
                    AttachmentOptions.withFileExtension(xml ? ".xml" : ".html"));
        } catch (RuntimeException ignored) {
        }
    }

    private static void driverLogs() {
        WebDriver driver = driver();
        if (driver == null) {
            return;
        }
        List<String> wanted = !(driver instanceof AppiumDriver)
                ? List.of("browser", "driver", "client")
                : "ios".equals(System.getProperty("platform"))
                ? List.of("syslog", "crashlog", "server")
                : List.of("logcat", "server");
        try {
            Set<String> available = driver.manage().logs().getAvailableLogTypes();
            for (String type : wanted) {
                if (!available.contains(type)) {
                    continue;
                }
                LogEntries entries = driver.manage().logs().get(type);
                StringBuilder text = new StringBuilder();
                entries.forEach(entry -> text.append(entry.getLevel())
                        .append(' ').append(entry.getMessage()).append('\n'));
                Allure.attachment(type + " log", "text/plain",
                        new ByteArrayInputStream(text.toString()
                                .getBytes(StandardCharsets.UTF_8)),
                        AttachmentOptions.withFileExtension(".log"));
            }
        } catch (RuntimeException ignored) {
        }
    }

    private static void stopScreenRecording(String name) {
        if (driver() instanceof CanRecordScreen recorder) {
            try {
                byte[] video = Base64.getDecoder().decode(recorder.stopRecordingScreen());
                Allure.attachment(name, "video/mp4", new ByteArrayInputStream(video),
                        AttachmentOptions.withFileExtension(".mp4"));
            } catch (RuntimeException ignored) {
            }
        }
    }

    private static String sessionId() {
        WebDriver driver = driver();
        if (!(driver instanceof RemoteWebDriver remote)) {
            return null;
        }
        SessionId id = remote.getSessionId();
        return id == null ? null : id.toString();
    }

    // ---- post-session artifacts ------------------------------------------

    /** Host dispatch — the actual fetching lives in SessionArtifacts. */
    private void sessionArtifacts(String sessionId, TestConfig config) {
        if (sessionId == null) {
            return;
        }
        if (mobile) {
            switch (System.getProperty("deviceHost", "")) {
                case "browserstack" -> {
                    if (config.attachVideo() || config.attachDriverLogs()) {
                        SessionArtifacts.browserstackArtifacts(sessionId, config);
                    }
                }
                case "selenoid" -> {
                    if (config.attachVideo()) {
                        SessionArtifacts.selenoidVideo(sessionId, config.selenoidUrl());
                    }
                }
                default -> {
                }
            }
        } else if (config.enableVideo() && config.attachVideo() && !blank(config.remoteUrl())) {
            SessionArtifacts.selenoidVideo(sessionId, config.remoteUrl());
        }
    }

    // ---- internals ---------------------------------------------------------

    private static WebDriver driver() {
        return WebDriverRunner.hasWebDriverStarted() ? WebDriverRunner.getWebDriver() : null;
    }

    private static TestConfig config() {
        return ConfigReader.testConfig;
    }

    private static boolean farm() {
        String host = System.getProperty("deviceHost", "");
        return "selenoid".equals(host) || "browserstack".equals(host);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank() || value.startsWith("${");
    }
}
