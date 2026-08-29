package helpers;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import config.ConfigReader;
import config.TestConfig;
import pages.App;

public final class PlaywrightRuntime implements AutoCloseable {

    private final Playwright playwright;
    private final Browser browser;
    public final BrowserContext context;
    public final Page page;
    public final App app;

    public PlaywrightRuntime(TestConfig config) {
        playwright = Playwright.create();
        var parts = config.browserSize().split("x");
        int width = Integer.parseInt(parts[0].trim());
        int height = Integer.parseInt(parts[1].trim());
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                .setHeadless(config.headless()));
        context = browser.newContext(new Browser.NewContextOptions()
                .setBaseURL(ConfigReader.resolveBaseUrl())
                .setViewportSize(width, height));
        page = context.newPage();
        page.setDefaultTimeout(15_000);
        app = new App(page);
    }

    @Override
    public void close() {
        playwright.close();
    }
}
