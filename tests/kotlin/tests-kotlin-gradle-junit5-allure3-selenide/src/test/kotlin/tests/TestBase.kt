package tests

import allure.AllureSelenideListeners
import allure.Attachments
import annotations.Framework
import annotations.Scope
import api.KtorHttp
import com.codeborne.selenide.Configuration
import com.codeborne.selenide.Selenide.closeWebDriver
import com.codeborne.selenide.Selenide.open
import com.codeborne.selenide.Selenide.sleep
import com.codeborne.selenide.WebDriverRunner
import com.codeborne.selenide.logevents.SimpleReport
import config.ConfigReader
import config.TestConfig
import helpers.BrowserSessionHelper
import helpers.HarCapture
import helpers.LocalChromePin
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInfo
import org.openqa.selenium.MutableCapabilities
import org.openqa.selenium.SessionNotCreatedException
import org.openqa.selenium.chrome.ChromeOptions
import pages.HomePage
import pages.LoginPage
import pages.RegisterPage

@Scope("browser")
@Framework("selenide")
open class TestBase : AllureMeta() {

    protected val homePage = HomePage()
    protected val loginPage = LoginPage()
    protected val registerPage = RegisterPage()

    companion object {
        @JvmField
        val config: TestConfig = ConfigReader.testConfig

        private val selenideReport = SimpleReport()

        private const val SESSION_ATTEMPTS = 3
        private const val SESSION_RETRY_DELAY_MS = 3_000L

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

            Configuration.baseUrl = config.baseUrl()
            Configuration.browser = config.browser()
            Configuration.browserSize = config.browserSize()
            Configuration.headless = config.headless()
            Configuration.timeout = 5_000

            // enableHar = collect CDP network events in the test process (not a hub capability).
            // attachHarLogs = put that HAR into Allure; implies capture so the attachment is not empty.
            val captureHar = config.enableHar() || config.attachHarLogs()

            if (config.remoteUrl().isNotBlank()) {
                // Remote hub (Selenoid): any browser the hub has; image tag = browserVersion.
                Configuration.browserVersion = config.browserVersion()
                Configuration.remote = config.remoteUrl()
                val selenoidOpts = hashMapOf<String, Any>(
                    "enableVNC" to config.enableVnc(),
                    "enableVideo" to config.enableVideo(),
                )
                val capabilities = MutableCapabilities()
                capabilities.setCapability("selenoid:options", selenoidOpts)
                if (captureHar && HarCapture.supportsBrowser(config.browser())) {
                    HarCapture.enablePerformanceLogging(capabilities)
                }
                Configuration.browserCapabilities = capabilities
            } else if (config.browser() == "chrome") {
                // Local Chrome only — Chrome for Testing pin, not system Chrome.
                LocalChromePin.apply(config.browserVersion())
                val chrome = ChromeOptions()
                if (config.headless()) {
                    chrome.addArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage")
                }
                if (captureHar && HarCapture.supportsBrowser(config.browser())) {
                    HarCapture.enablePerformanceLogging(chrome)
                }
                if (config.headless() || captureHar) {
                    Configuration.browserCapabilities = chrome
                }
            } else {
                // Local non-Chrome: Selenide / Selenium Manager; LocalChromePin does not apply.
                Configuration.browserVersion = config.browserVersion()
            }

            if (AllureSelenideListeners.isGloballyEnabled(config)) {
                AllureSelenideListeners.setEnabled(true)
            }
        }

        /**
         * A shared Selenoid hub can refuse a session when it has no free slot, which
         * surfaces as [SessionNotCreatedException] from the first browser call
         * inside a test. Claiming the session here — with retries — keeps that hub
         * hiccup out of the test body.
         */
        private fun ensureBrowserSession() {
            if (WebDriverRunner.hasWebDriverStarted()) {
                return
            }
            var attempt = 1
            while (true) {
                try {
                    open()
                    return
                } catch (hubRefusedSession: SessionNotCreatedException) {
                    closeWebDriver()
                    if (attempt >= SESSION_ATTEMPTS) {
                        throw hubRefusedSession
                    }
                    sleep(SESSION_RETRY_DELAY_MS)
                    attempt++
                }
            }
        }

        @JvmStatic
        @AfterAll
        fun afterAll() {
            if (config.closeBrowserAfterAll() && WebDriverRunner.hasWebDriverStarted()) {
                closeWebDriver()
            }
        }
    }

    @BeforeEach
    fun beforeEach() {
        if (config.logToConsole() && config.selenideLogToConsole()) {
            selenideReport.start()
        }
        val reusedSession = WebDriverRunner.hasWebDriverStarted()
        if (!config.skipBlankOpen()) {
            ensureBrowserSession()
        }
        if (!config.closeBrowserAfterEach() && reusedSession) {
            BrowserSessionHelper.resetPageState()
        }
    }

    @AfterEach
    fun afterEach(testInfo: TestInfo) {
        try {
            if (config.logToConsole() && config.selenideLogToConsole()) {
                selenideReport.finish(testInfo.displayName)
            }
            if (allureResultsEnabled() && WebDriverRunner.hasWebDriverStarted()) {
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
            // HAR from Chrome Performance logs — attach while the session is still
            // alive, even if screenshot/source/video threw. Close the hub slot last.
            try {
                if (allureResultsEnabled() && config.attachHarLogs()
                    && WebDriverRunner.hasWebDriverStarted()
                ) {
                    Attachments.harLogs()
                }
            } finally {
                if (config.closeBrowserAfterEach()) {
                    closeWebDriver()
                }
            }
        }
    }
}
