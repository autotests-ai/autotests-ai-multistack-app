package tests;

import allure.Attachments;
import annotations.Framework;
import annotations.Scope;
import config.ConfigReader;
import config.TestConfig;
import helpers.PlaywrightRuntime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import pages.App;

@Scope("browser")
@Framework("playwright")
public class TestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    private PlaywrightRuntime runtime;
    protected App app;

    private static boolean allureResultsEnabled() {
        return !"none".equals(config.allureReportMode());
    }

    @BeforeAll
    static void setup() {
        if (config.logToConsole()) {
            System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", config.rootLogLevel());
        } else {
            System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", "off");
        }
    }

    @BeforeEach
    void startPlaywright() {
        runtime = new PlaywrightRuntime(config);
        app = runtime.app;
    }

    @AfterEach
    void stopPlaywright() {
        if (runtime == null) {
            return;
        }
        try {
            if (allureResultsEnabled()) {
                if (config.attachBrowserConsoleLogs()) {
                    Attachments.browserConsoleLogs(runtime.consoleText());
                }
                if (config.attachPageSource()) {
                    Attachments.pageSource(runtime.page);
                }
                if (config.attachLastScreenshot()) {
                    Attachments.screenshot(runtime.page, "Last screenshot");
                }
            }
        } finally {
            runtime.close();
            runtime = null;
        }
    }
}
