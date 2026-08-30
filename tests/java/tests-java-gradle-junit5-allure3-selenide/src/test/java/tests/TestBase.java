package tests;

import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.WebDriverRunner;
import com.codeborne.selenide.logevents.SimpleReport;

import allure.AllureSelenideListeners;
import allure.Attachments;
import annotations.Framework;
import annotations.Scope;
import config.ConfigReader;
import config.TestConfig;
import helpers.BrowserSessionHelper;
import helpers.HarCapture;
import helpers.LocalChromePin;
import helpers.NativeSetValue;
import pages.HomePage;
import pages.LoginPage;
import pages.RegisterPage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.SessionNotCreatedException;
import org.openqa.selenium.chrome.ChromeOptions;

import java.util.HashMap;

import static com.codeborne.selenide.Selenide.closeWebDriver;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.sleep;


@Scope("browser")
@Framework("selenide")
public class TestBase extends AllureMeta {

    protected final HomePage homePage = new HomePage();
    protected final LoginPage loginPage = new LoginPage();
    protected final RegisterPage registerPage = new RegisterPage();

    protected static final TestConfig config = ConfigReader.testConfig;
    private static final SimpleReport selenideReport = new SimpleReport();

    private static final int SESSION_ATTEMPTS = 3;
    private static final long SESSION_RETRY_DELAY_MS = 3_000;

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

        Configuration.baseUrl = config.baseUrl();
        Configuration.browser = config.browser();
        Configuration.browserSize = config.browserSize();
        Configuration.headless = config.headless();
        Configuration.timeout = 5_000;
        Configuration.fastSetValue = config.fastSetValue();
        if (config.fastSetValue()) {
            NativeSetValue.install();
        }

        // enableHar = collect CDP network events in the test process (not a hub capability).
        // attachHarLogs = put that HAR into Allure; implies capture so the attachment is not empty.
        boolean captureHar = config.enableHar() || config.attachHarLogs();

        if (!config.remoteUrl().isBlank()) {
            // Remote hub (Selenoid): any browser the hub has; image tag = browserVersion.
            Configuration.browserVersion = config.browserVersion();
            Configuration.remote = config.remoteUrl();
            var selenoidOpts = new HashMap<String, Object>();
            selenoidOpts.put("enableVNC", config.enableVnc());
            selenoidOpts.put("enableVideo", config.enableVideo());
            var capabilities = new MutableCapabilities();
            capabilities.setCapability("selenoid:options", selenoidOpts);
            if (captureHar && HarCapture.supportsBrowser(config.browser())) {
                HarCapture.enablePerformanceLogging(capabilities);
            }
            Configuration.browserCapabilities = capabilities;
        } else if ("chrome".equals(config.browser())) {
            // Local Chrome only — Chrome for Testing pin, not system Chrome.
            LocalChromePin.apply(config.browserVersion());
            ChromeOptions chrome = new ChromeOptions();
            if (config.headless()) {
                chrome.addArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
            }
            if (captureHar && HarCapture.supportsBrowser(config.browser())) {
                HarCapture.enablePerformanceLogging(chrome);
            }
            if (config.headless() || captureHar) {
                Configuration.browserCapabilities = chrome;
            }
        } else {
            // Local non-Chrome: Selenide / Selenium Manager; LocalChromePin does not apply.
            Configuration.browserVersion = config.browserVersion();
        }

        if (AllureSelenideListeners.isGloballyEnabled(config)) {
            AllureSelenideListeners.setEnabled(true);
        }
    }

    /**
     * A shared Selenoid hub can refuse a session when it has no free slot, which
     * surfaces as {@link SessionNotCreatedException} from the first browser call
     * inside a test. Claiming the session here — with retries — keeps that hub
     * hiccup out of the test body.
     */
    private static void ensureBrowserSession() {
        if (WebDriverRunner.hasWebDriverStarted()) {
            return;
        }
        for (int attempt = 1; ; attempt++) {
            try {
                open();
                return;
            } catch (SessionNotCreatedException hubRefusedSession) {
                closeWebDriver();
                if (attempt >= SESSION_ATTEMPTS) {
                    throw hubRefusedSession;
                }
                sleep(SESSION_RETRY_DELAY_MS);
            }
        }
    }

    @BeforeEach
    void beforeEach() {
        if (config.logToConsole() && config.selenideLogToConsole()) {
            selenideReport.start();
        }
        boolean reusedSession = WebDriverRunner.hasWebDriverStarted();
        if (!config.skipBlankOpen()) {
            ensureBrowserSession();
        }
        if (!config.closeBrowserAfterEach() && reusedSession) {
            BrowserSessionHelper.resetPageState();
        }
    }

    @AfterEach
    void afterEach(TestInfo testInfo) {
        try {
            if (config.logToConsole() && config.selenideLogToConsole()) {
                selenideReport.finish(testInfo.getDisplayName());
            }
            if (allureResultsEnabled() && WebDriverRunner.hasWebDriverStarted()) {
                if (config.attachBrowserConsoleLogs()) {
                    Attachments.browserConsoleLogs();
                }
                if (config.attachPageSource()) {
                    Attachments.pageSource();
                }
                if (config.attachLastScreenshot()) {
                    Attachments.screenshot("Last screenshot");
                }
                if (config.enableVideo() && config.attachVideo()) {
                    Attachments.video();
                }
            }
        } finally {
            // HAR from Chrome Performance logs — attach while the session is still
            // alive, even if screenshot/source/video threw. Close the hub slot last.
            try {
                if (allureResultsEnabled() && config.attachHarLogs()
                        && WebDriverRunner.hasWebDriverStarted()) {
                    Attachments.harLogs();
                }
            } finally {
                if (config.closeBrowserAfterEach()) {
                    closeWebDriver();
                }
            }
        }
    }

    @AfterAll
    static void afterAll() {
        if (config.closeBrowserAfterAll() && WebDriverRunner.hasWebDriverStarted()) {
            closeWebDriver();
        }
    }

}
