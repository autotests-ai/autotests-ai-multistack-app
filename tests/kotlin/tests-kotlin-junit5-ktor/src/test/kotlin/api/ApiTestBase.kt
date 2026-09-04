package api

import annotations.Framework
import config.ConfigReader
import config.TestConfig
import org.junit.jupiter.api.BeforeAll
import tests.AllureMeta

@Framework("ktor")
open class ApiTestBase : AllureMeta() {

    companion object {
        @JvmField
        val config: TestConfig = ConfigReader.testConfig

        @JvmStatic
        @BeforeAll
        fun setupKtor() {
            KtorHttp.setup(config)
        }
    }
}
