package allure;

import config.ConfigReader;
import config.TestConfig;
import drivers.mobile.MobileDriver;
import io.appium.java_client.screenrecording.CanRecordScreen;
import io.qameta.allure.Allure;
import io.qameta.allure.AttachmentOptions;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestExecutionExceptionHandler;
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

/**
 * Allure attachments, host-agnostic:
 *
 *   local device → screen recording (mp4)
 *   farm device  → screenshot + post-session artifacts ({@link SessionArtifacts})
 *   any failure  → screenshot of the failing state ({@link ScreenshotOnFailure})
 *
 * Each kind is toggled by its own config flag: attachLastScreenshot,
 * attachPageSource, attachDriverLogs (logcat/syslog + Appium server log),
 * attachVideo.
 */
public class Attach {

    private boolean recording;

    /** After the session starts: starts recording on a local device. */
    public void beforeTest(WebDriver driver) {
        if (!farm() && config().attachVideo() && driver instanceof CanRecordScreen recorder) {
            recording = bestEffort(() -> {
                recorder.startRecordingScreen();
                return true;
            }) != null;
        }
    }

    /** In @AfterEach: live artifacts (each by its flag) → quit → post-session. */
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
            MobileDriver.quit();
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
            attach("Page source", "text/xml", ".xml", () -> utf8(driver.getPageSource()));
        }
        if (config.attachDriverLogs()) {
            driverLogs(driver);
        }
    }

    /** logcat (android) or syslog/crashlog (ios) + the Appium server log. */
    private static void driverLogs(WebDriver driver) {
        List<String> wanted = "ios".equals(System.getProperty("platform"))
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
    private static void sessionArtifacts(String sessionId, TestConfig config) {
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

    /** Failing-state screenshot while the session is still alive (before @AfterEach). */
    public static final class ScreenshotOnFailure implements TestExecutionExceptionHandler {
        @Override
        public void handleTestExecutionException(ExtensionContext context, Throwable throwable)
                throws Throwable {
            if (liveDriver() instanceof TakesScreenshot camera) {
                attach("Screenshot on failure", "image/png", ".png",
                        () -> camera.getScreenshotAs(OutputType.BYTES));
            }
            throw throwable;
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
        return MobileDriver.started() ? MobileDriver.get() : null;
    }

    private static TestConfig config() {
        return ConfigReader.testConfig;
    }

    private static boolean farm() {
        String host = System.getProperty("deviceHost", "");
        return "selenoid".equals(host) || "browserstack".equals(host);
    }
}
