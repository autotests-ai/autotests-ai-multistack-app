package helpers;

import allure.Attachments;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import config.ConfigReader;
import config.TestConfig;
import pages.App;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;

public final class PlaywrightRuntime implements AutoCloseable {

    private final Playwright playwright;
    private final Browser browser;
    public final BrowserContext context;
    public final Page page;
    public final App app;
    private final Path harPath;
    private final boolean attachHar;

    public PlaywrightRuntime(TestConfig config) {
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

        if (SelenoidPlaywrightEndpoint.isWebSocket(remote)) {
            var endpoint = SelenoidPlaywrightEndpoint.withSessionQuery(
                    remote, config.enableVnc(), config.enableVideo() || config.attachVideo());
            browser = playwright.chromium().connect(
                    endpoint, new BrowserType.ConnectOptions().setTimeout(120_000));
        } else {
            var launch = new BrowserType.LaunchOptions().setHeadless(config.headless());
            if (remote.isEmpty() && "chrome".equalsIgnoreCase(config.browser())) {
                LocalChromePin.apply(config.browserVersion());
                launch.setExecutablePath(LocalChromePin.chromeExecutable());
                var args = config.headless()
                        ? List.of("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
                                "--force-device-scale-factor=1")
                        : List.of("--force-device-scale-factor=1");
                launch.setArgs(args);
            }
            browser = playwright.chromium().launch(launch);
        }

        boolean captureHar = config.enableHar() || config.attachHarLogs();
        Path recordedHar = null;
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
        this.harPath = recordedHar;
        this.attachHar = config.attachHarLogs();

        context = browser.newContext(contextOptions);
        page = context.newPage();
        page.setDefaultTimeout(15_000);
        ViewportHelper.bind(page);
        app = new App(page);
    }

    @Override
    public void close() {
        try {
            context.close();
            if (attachHar && harPath != null) {
                Attachments.harLogs(harPath);
            }
        } finally {
            ViewportHelper.unbind();
            try {
                browser.close();
            } catch (RuntimeException ignored) {
                // disconnect after context.close is best-effort
            }
            playwright.close();
            if (harPath != null) {
                try {
                    var dir = harPath.getParent();
                    Files.deleteIfExists(harPath);
                    if (dir != null && dir.getFileName() != null
                            && dir.getFileName().toString().startsWith("pw-har-")) {
                        Files.deleteIfExists(dir);
                    }
                } catch (IOException ignored) {
                    // temp HAR is best-effort
                }
            }
        }
    }
}
