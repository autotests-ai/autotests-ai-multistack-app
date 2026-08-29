package tests;

import annotations.Framework;
import annotations.Language;
import annotations.Module;
import annotations.Scope;
import config.ConfigReader;
import config.TestConfig;
import helpers.Attachments;
import helpers.WebDriverHolder;
import helpers.WebDrivers;
import io.qameta.allure.Owner;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import pages.HomePage;
import pages.LoginPage;
import pages.RegisterPage;

@Owner("stanislav")
@Module("tests-java-gradle-junit5-allure3-selenium")
@Language("java")
@Scope("browser")
@Framework("selenium")
public class TestBase {

    protected final HomePage homePage = new HomePage();
    protected final LoginPage loginPage = new LoginPage();
    protected final RegisterPage registerPage = new RegisterPage();

    protected static final TestConfig config = ConfigReader.testConfig;

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
    void beforeEach() {
        if (!config.skipBlankOpen()) {
            WebDrivers.ensureSession();
        }
    }

    @AfterEach
    void afterEach() {
        try {
            if (allureResultsEnabled() && WebDriverHolder.has()) {
                if (config.attachBrowserConsoleLogs()) {
                    Attachments.browserConsoleLogs();
                }
                if (config.attachPageSource()) {
                    Attachments.pageSource();
                }
                if (config.attachLastScreenshot()) {
                    Attachments.screenshot("Last screenshot");
                }
            }
        } finally {
            if (config.closeBrowserAfterEach()) {
                WebDriverHolder.quit();
            }
        }
    }

    @AfterAll
    static void afterAll() {
        if (config.closeBrowserAfterAll() && WebDriverHolder.has()) {
            WebDriverHolder.quit();
        }
    }
}
