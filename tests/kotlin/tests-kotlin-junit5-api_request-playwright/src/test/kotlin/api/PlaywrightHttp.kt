package api

import com.microsoft.playwright.APIRequest
import com.microsoft.playwright.APIRequestContext
import com.microsoft.playwright.Playwright
import com.microsoft.playwright.options.RequestOptions
import config.ConfigReader
import config.TestConfig
import io.qameta.allure.Allure

/**
 * Shared Playwright `APIRequestContext` against [ConfigReader.resolveApiBaseUrl].
 */
object PlaywrightHttp {

    const val WRONG_CREDENTIALS_MESSAGE: String = "Wrong login or password"

    @Volatile
    private var playwright: Playwright? = null

    @Volatile
    private var api: APIRequestContext? = null

    @Volatile
    private var origin: String = ""

    @Volatile
    private var config: TestConfig? = null

    @Synchronized
    fun setup(testConfig: TestConfig) {
        if (api != null) {
            return
        }
        config = testConfig
        origin = ConfigReader.resolveApiBaseUrl().trimEnd('/')
        val pw = Playwright.create()
        playwright = pw
        api = pw.request().newContext(
            APIRequest.NewContextOptions()
                .setBaseURL(origin)
                .setTimeout(10_000.0)
                .setIgnoreHTTPSErrors(true),
        )
        Runtime.getRuntime().addShutdownHook(Thread { close() })
    }

    fun request(
        method: String,
        path: String,
        json: Any? = null,
        raw: String? = null,
        token: String? = null,
    ): HttpResult {
        val http = checkNotNull(api) { "PlaywrightHttp.setup() first" }
        val options = RequestOptions.create()
        if (token != null) {
            options.setHeader("Authorization", "Bearer $token")
        }
        when {
            json != null -> {
                options.setHeader("Content-Type", "application/json")
                options.setData(HttpResult.MAPPER.writeValueAsString(json))
            }
            raw != null -> {
                options.setHeader("Content-Type", "application/json")
                options.setData(raw)
            }
        }
        val verb = method.uppercase()
        val urlPath = pathOf(path)
        val response = when (verb) {
            "GET" -> http.get(urlPath, options)
            "POST" -> http.post(urlPath, options)
            "PUT" -> http.put(urlPath, options)
            "DELETE" -> http.delete(urlPath, options)
            else -> error(verb)
        }
        try {
            val result = HttpResult(response.status(), response.text())
            attach(verb, origin + urlPath, result.status, result.body)
            return result
        } finally {
            response.dispose()
        }
    }

    private fun attach(method: String, url: String, status: Int, body: String) {
        val cfg = config ?: return
        if (cfg.allureReportMode() == "none" || !cfg.enableAllureRestAssuredListener()) {
            return
        }
        try {
            Allure.addAttachment("Request", "text/plain", "$method $url")
            Allure.addAttachment("Response", "text/plain", "$status\n$body")
        } catch (_: RuntimeException) {
            // Allure context is optional; never mask the HTTP call.
        }
    }

    @Synchronized
    private fun close() {
        api?.dispose()
        api = null
        playwright?.close()
        playwright = null
    }

    private fun pathOf(path: String): String = if (path.startsWith("/")) path else "/$path"
}
