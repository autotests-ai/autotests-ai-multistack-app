package tests

import annotations.Framework
import annotations.Scope
import api.KtorHttp
import config.ConfigReader
import config.TestConfig
import helpers.Attachments
import helpers.WebDriverHolder
import helpers.WebDrivers
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import pages.HomePage
import pages.LoginPage
import pages.RegisterPage

@Scope("browser")
@Framework("selenium")
open class TestBase : AllureMeta() {

    protected val homePage = HomePage()
    protected val loginPage = LoginPage()
    protected val registerPage = RegisterPage()

    companion object {
        @JvmField
        val config: TestConfig = ConfigReader.testConfig

        private fun allureResultsEnabled(): Boolean = config.allureReportMode() != "none"

        @JvmStatic
        @BeforeAll
        fun setup() {
            if (config.logToConsole()) {
                System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", config.rootLogLevel())
            } else {
                System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", "off")
            }

            KtorHttp.setup(config)
        }

        @JvmStatic
        @AfterAll
        fun afterAll() {
            if (config.closeBrowserAfterAll() && WebDriverHolder.has()) {
                WebDriverHolder.quit()
            }
        }
    }

    @BeforeEach
    fun beforeEach() {
        if (!config.skipBlankOpen()) {
            WebDrivers.ensureSession()
        }
    }

    @AfterEach
    fun afterEach() {
        try {
            if (allureResultsEnabled() && WebDriverHolder.has()) {
                if (config.attachBrowserConsoleLogs()) {
                    Attachments.browserConsoleLogs()
                }
                if (config.attachPageSource()) {
                    Attachments.pageSource()
                }
                if (config.attachLastScreenshot()) {
                    Attachments.screenshot("Last screenshot")
                }
                if (config.enableVideo() && config.attachVideo()) {
                    Attachments.video()
                }
            }
        } finally {
            try {
                if (allureResultsEnabled() && config.attachHarLogs() && WebDriverHolder.has()) {
                    Attachments.harLogs()
                }
            } finally {
                if (config.closeBrowserAfterEach()) {
                    WebDriverHolder.quit()
                }
            }
        }
    }
}
