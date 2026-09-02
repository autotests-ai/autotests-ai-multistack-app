package allure

import config.TestConfig
import io.ktor.client.plugins.api.createClientPlugin
import io.qameta.allure.Allure

/**
 * Allure HTTP attachments for Ktor client.
 * Reuses [TestConfig.enableAllureRestAssuredListener] so ci.properties stays the same
 * switch as the Rest Assured / Retrofit 2 siblings.
 */
object AllureKtor {

    fun isEnabled(config: TestConfig): Boolean =
        config.allureReportMode() != "none" && config.enableAllureRestAssuredListener()

    val plugin = createClientPlugin("AllureKtor") {
        onRequest { request, _ ->
            Allure.addAttachment(
                "Request",
                "text/plain",
                "${request.method.value} ${request.url}",
            )
        }
        onResponse { response ->
            Allure.addAttachment(
                "Response",
                "text/plain",
                "${response.status}",
            )
        }
    }
}
