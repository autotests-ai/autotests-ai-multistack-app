package helpers;

import allure.Attachments;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.PlaywrightException;
import config.ConfigReader;
import config.TestConfig;
import pages.App;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class PlaywrightRuntime implements AutoCloseable {

    private static final int SESSION_ATTEMPTS = 3;
    private static final long SESSION_RETRY_DELAY_MS = 3_000;

    private final Playwright playwright;
    private final Browser browser;
    public final BrowserContext context;
    public final Page page;
    public final App app;
    private final StringBuilder consoleLog = new StringBuilder();
    private final Path harPath;
    private final Path videoDir;
    private final String hubVideoName;
    private final String videoFolder;
    private final boolean attachHar;
    private final boolean attachVideo;
    private final boolean attachHubVideo;

    public PlaywrightRuntime(TestConfig config) {
        requireChromium(config);
        var env = new HashMap<>(System.getenv());
        env.put("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1");
        playwright = Playwright.create(new Playwright.CreateOptions().setEnv(env));
        var parts = config.browserSize().split("x");
        int width = Integer.parseInt(parts[0].trim());
        int height = Integer.parseInt(parts[1].trim());
        var remote = SelenoidPlaywrightEndpoint.resolve(config.remoteUrl());

        if (SelenoidPlaywrightEndpoint.isHttpUrl(remote)) {
            throw new IllegalStateException(
                    "Playwright Java cannot use Selenoid WebDriver "
                            + SelenoidPlaywrightEndpoint.describe(remote)
                            + ". Set SELENOID_PLAYWRIGHT_URL (wss://…/playwright/playwright-chromium/…).");
        }

        boolean hub = SelenoidPlaywrightEndpoint.isWebSocket(remote);
        boolean recordHubVideo = hub && (config.enableVideo() || config.attachVideo());
        String recordedHubVideoName = recordHubVideo
                ? "autotests-ai-multistack-kotlin-pw-" + UUID.randomUUID() + ".mp4"
                : null;

        if (hub) {
            var endpoint = SelenoidPlaywrightEndpoint.withSessionQuery(
                    remote,
                    config.enableVnc(),
                    recordHubVideo,
                    recordedHubVideoName,
                    screenResolution(config));
            browser = connectWithRetry(playwright, endpoint);
        } else {
            LocalChromePin.apply(config.browserVersion());
            var launch = new BrowserType.LaunchOptions()
                    .setHeadless(config.headless())
                    .setExecutablePath(LocalChromePin.chromeExecutable());
            var args = config.headless()
                    ? List.of("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
                            "--force-device-scale-factor=1")
                    : List.of("--force-device-scale-factor=1");
            launch.setArgs(args);
            browser = playwright.chromium().launch(launch);
        }

        boolean captureHar = config.enableHar() || config.attachHarLogs();
        Path recordedHar = null;
        Path recordedVideo = null;
        var contextOptions = new Browser.NewContextOptions()
                .setBaseURL(ConfigReader.resolveBaseUrl())
                .setViewportSize(width, height)
                .setDeviceScaleFactor(1);
        if (captureHar && HarCapture.supportsBrowser(config.browser())) {
            try {
                recordedHar = Files.createTempDirectory("pw-har-").resolve("capture.har");
            } catch (IOException e) {
                throw new IllegalStateException("Cannot create HAR temp file", e);
            }
            HarCapture.enableRecording(contextOptions, recordedHar);
        }
        boolean localVideo = !hub && config.attachVideo();
        if (localVideo) {
            try {
                recordedVideo = Files.createTempDirectory("pw-video-");
            } catch (IOException e) {
                throw new IllegalStateException("Cannot create video temp dir", e);
            }
            contextOptions.setRecordVideoDir(recordedVideo);
        }
        this.harPath = recordedHar;
        this.videoDir = recordedVideo;
        this.hubVideoName = recordedHubVideoName;
        this.videoFolder = config.videoFolder();
        this.attachHar = config.attachHarLogs();
        this.attachVideo = localVideo;
        this.attachHubVideo = config.attachVideo() && recordedHubVideoName != null;

        context = browser.newContext(contextOptions);
        page = context.newPage();
        page.setDefaultTimeout(5_000);
        page.onConsoleMessage(msg ->
                consoleLog.append(msg.type()).append(' ').append(msg.text()).append('\n'));
        ViewportHelper.bind(page);
        app = new App(page);
    }

    public String consoleText() {
        return consoleLog.toString();
    }

    public static void requireChromium(TestConfig config) {
        var browser = config.browser() == null ? "" : config.browser().trim().toLowerCase(Locale.ROOT);
        if (!browser.equals("chrome") && !browser.equals("chromium")) {
            throw new IllegalStateException(
                    "This Playwright cell is Chromium-only: local Chrome for Testing, "
                            + "or Selenoid wss://…/playwright-chromium/…. Got browser="
                            + config.browser());
        }
    }

    private static Browser connectWithRetry(Playwright playwright, String endpoint) {
        PlaywrightException last = null;
        for (int attempt = 1; attempt <= SESSION_ATTEMPTS; attempt++) {
            try {
                return playwright.chromium().connect(
                        endpoint, new BrowserType.ConnectOptions().setTimeout(120_000));
            } catch (PlaywrightException hubRefusedSession) {
                last = hubRefusedSession;
                if (attempt == SESSION_ATTEMPTS) {
                    break;
                }
                sleep(SESSION_RETRY_DELAY_MS);
            }
        }
        throw last;
    }

    private static String screenResolution(TestConfig config) {
        var size = config.browserSize();
        if (size == null || size.isBlank()) {
            return "1920x1080x24";
        }
        var parts = size.split("x");
        if (parts.length < 2) {
            return "1920x1080x24";
        }
        return parts[0].trim() + "x" + parts[1].trim() + "x24";
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    @Override
    public void close() {
        try {
            context.close();
            if (attachHar && harPath != null) {
                Attachments.harLogs(harPath);
            }
            if (attachVideo && videoDir != null) {
                Attachments.video(videoDir);
            }
        } finally {
            ViewportHelper.unbind();
            try {
                browser.close();
            } catch (RuntimeException ignored) {
                // disconnect after context.close is best-effort
            }
            if (attachHubVideo) {
                Attachments.video(videoFolder, hubVideoName);
            }
            playwright.close();
            deleteTempFile(harPath, "pw-har-");
            deleteTempTree(videoDir, "pw-video-");
        }
    }

    private static void deleteTempFile(Path file, String parentPrefix) {
        if (file == null) {
            return;
        }
        try {
            Files.deleteIfExists(file);
            var dir = file.getParent();
            if (dir != null && dir.getFileName() != null
                    && dir.getFileName().toString().startsWith(parentPrefix)) {
                Files.deleteIfExists(dir);
            }
        } catch (IOException ignored) {
            // temp HAR is best-effort
        }
    }

    private static void deleteTempTree(Path dir, String prefix) {
        if (dir == null || dir.getFileName() == null
                || !dir.getFileName().toString().startsWith(prefix)) {
            return;
        }
        try (var walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // temp video is best-effort
                }
            });
        } catch (IOException ignored) {
            // temp video is best-effort
        }
    }
}
