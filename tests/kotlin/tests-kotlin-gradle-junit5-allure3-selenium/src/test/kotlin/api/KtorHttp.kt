package api

import allure.AllureKtor
import config.ConfigReader
import config.TestConfig
import io.ktor.client.HttpClient
import io.ktor.client.engine.java.Java
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.contentType
import kotlinx.coroutines.runBlocking

/**
 * Shared Ktor client against [ConfigReader.resolveApiBaseUrl].
 */
object KtorHttp {

    const val WRONG_CREDENTIALS_MESSAGE: String = "Wrong login or password"

    @Volatile
    private var client: HttpClient? = null

    @Volatile
    private var origin: String = ""

    @Synchronized
    fun setup(config: TestConfig) {
        if (client != null) {
            return
        }
        origin = ConfigReader.resolveApiBaseUrl().trimEnd('/')
        client = HttpClient(Java) {
            expectSuccess = false
            install(HttpTimeout) {
                requestTimeoutMillis = 10_000
                connectTimeoutMillis = 10_000
            }
            if (AllureKtor.isEnabled(config)) {
                install(AllureKtor.plugin)
            }
        }
    }

    fun request(
        method: HttpMethod,
        path: String,
        json: Any? = null,
        raw: String? = null,
        token: String? = null,
    ): HttpResult = runBlocking {
        val http = checkNotNull(client) { "KtorHttp.setup() first" }
        val response = http.request(origin + pathOf(path)) {
            this.method = method
            if (json != null) {
                contentType(ContentType.Application.Json)
                setBody(HttpResult.MAPPER.writeValueAsString(json))
            } else if (raw != null) {
                contentType(ContentType.Application.Json)
                setBody(raw)
            }
            if (token != null) {
                header(HttpHeaders.Authorization, "Bearer $token")
            }
        }
        HttpResult(response.status.value, response.bodyAsText())
    }

    private fun pathOf(path: String): String = if (path.startsWith("/")) path else "/$path"
}
