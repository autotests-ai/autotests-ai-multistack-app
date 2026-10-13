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
import org.openqa.selenium.remote.RemoteWebDriver;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

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

    /** After the session starts: remembers the kind, starts recording on local mobile. */
    public void beforeTest() {
        WebDriver driver = liveDriver();
        mobile = driver instanceof AppiumDriver;
        if (!farm() && config().attachVideo() && driver instanceof CanRecordScreen recorder) {
            recording = bestEffort(() -> {
                recorder.startRecordingScreen();
                return true;
            }) != null;
        }
    }

    /** In @AfterEach: live artifacts (each by its flag) → closeWebDriver → post-session. */
    public void afterTest() {
        TestConfig config = config();
        WebDriver driver = liveDriver();
        String sessionId = driver instanceof RemoteWebDriver remote && remote.getSessionId() != null
                ? remote.getSessionId().toString() : null;
        try {
            if (driver != null) {
                liveArtifacts(driver, config);
            }
        } finally {
            recording = false;
            closeWebDriver();
        }
        if (sessionId != null) {
            bestEffort(() -> {
                sessionArtifacts(sessionId, config);
                return null;
            });
        }
    }

    private void liveArtifacts(WebDriver driver, TestConfig config) {
        if (recording && driver instanceof CanRecordScreen recorder) {
            attach("Video", "video/mp4", ".mp4",
                    () -> Base64.getDecoder().decode(recorder.stopRecordingScreen()));
        } else if (config.attachLastScreenshot() && driver instanceof TakesScreenshot camera) {
            attach("Screenshot", "image/png", ".png", () -> camera.getScreenshotAs(OutputType.BYTES));
        }
        if (config.attachPageSource()) {
            boolean xml = driver instanceof AppiumDriver;
            attach("Page source", xml ? "text/xml" : "text/html", xml ? ".xml" : ".html",
                    () -> utf8(driver.getPageSource()));
        }
        if (config.attachDriverLogs()) {
            driverLogs(driver);
        }
    }

    /** logcat/syslog + appium server on devices, browser/driver/client on web. */
    private static void driverLogs(WebDriver driver) {
        List<String> wanted = !(driver instanceof AppiumDriver)
                ? List.of("browser", "driver", "client")
                : "ios".equals(System.getProperty("platform"))
                ? List.of("syslog", "crashlog", "server")
                : List.of("logcat", "server");
        Set<String> available = bestEffort(() -> driver.manage().logs().getAvailableLogTypes());
        if (available == null) {
            return;
        }
        wanted.stream().filter(available::contains).forEach(type ->
                attach(type + " log", "text/plain", ".log", () -> {
                    StringBuilder text = new StringBuilder();
                    driver.manage().logs().get(type).forEach(entry -> text.append(entry.getLevel())
                            .append(' ').append(entry.getMessage()).append('\n'));
                    return utf8(text.toString());
                }));
    }

    /** Host dispatch — the actual fetching lives in SessionArtifacts. */
    private void sessionArtifacts(String sessionId, TestConfig config) {
        if (!mobile) {
            if (config.enableVideo() && config.attachVideo() && !blank(config.remoteUrl())) {
                SessionArtifacts.selenoidVideo(sessionId, config.remoteUrl());
            }
            return;
        }
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
    }

    /** Artifacts are best-effort: a dead session must never fail or mask the test. */
    private static void attach(String name, String mimeType, String extension, Supplier<byte[]> content) {
        byte[] bytes = bestEffort(content);
        if (bytes != null) {
            Allure.attachment(name, mimeType, new ByteArrayInputStream(bytes),
                    AttachmentOptions.withFileExtension(extension));
        }
    }

    private static <T> T bestEffort(Supplier<T> action) {
        try {
            return action.get();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    private static WebDriver liveDriver() {
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
