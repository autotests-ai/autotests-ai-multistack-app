package tests

import allure.Attachments
import annotations.Framework
import annotations.Scope
import api.PlaywrightHttp
import config.ConfigReader
import config.TestConfig
import helpers.PlaywrightRuntime
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import pages.App

@Scope("browser")
@Framework("playwright")
open class TestBase : AllureMeta() {

    protected val config: TestConfig = Companion.config
    private var runtime: PlaywrightRuntime? = null
    protected lateinit var app: App

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
            PlaywrightHttp.setup(config)
        }
    }

    @BeforeEach
    fun startPlaywright() {
        val started = PlaywrightRuntime(config)
        runtime = started
        app = started.app
    }

    @AfterEach
    fun stopPlaywright() {
        val started = runtime ?: return
        try {
            if (allureResultsEnabled()) {
                if (config.attachBrowserConsoleLogs()) {
                    Attachments.browserConsoleLogs(started.consoleText())
                }
                if (config.attachPageSource()) {
                    Attachments.pageSource(started.page)
                }
                if (config.attachLastScreenshot()) {
                    Attachments.screenshot(started.page, "Last screenshot")
                }
            }
        } finally {
            started.close()
            runtime = null
        }
    }
}
