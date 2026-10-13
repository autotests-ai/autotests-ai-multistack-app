package dev.multistack.app.allure

import dev.multistack.app.AppDependencies
import dev.multistack.app.appModule
import dev.multistack.app.config.AppConfig
import dev.multistack.app.db.Database
import dev.multistack.app.managementModule
import io.qameta.allure.Allure
import io.qameta.allure.Owner
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Tag
import org.testcontainers.postgresql.PostgreSQLContainer
import java.net.ServerSocket
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * Full Ktor app against real PostgreSQL — classical application integration.
 * Runs in CI before build/deploy; not HTTP against a live stand.
 */
@Owner("stanislav")
@Layer("integration")
@Tag("integration")
@Module("backend-kotlin-ktor")
@Language("kotlin")
abstract class IntegrationTestBase {

    protected val http: HttpClient = HttpClient.newHttpClient()

    protected fun get(url: String, token: String? = null): HttpResponse<String> =
        Allure.step("GET $url", Allure.ThrowableRunnable {
            http.send(request(url, token).GET().build(), HttpResponse.BodyHandlers.ofString())
        })

    protected fun postJson(url: String, body: String, token: String? = null): HttpResponse<String> =
        Allure.step("POST $url", Allure.ThrowableRunnable {
            http.send(
                request(url, token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build(),
                HttpResponse.BodyHandlers.ofString(),
            )
        })

    protected fun delete(url: String, token: String): HttpResponse<String> =
        Allure.step("DELETE $url", Allure.ThrowableRunnable {
            http.send(request(url, token).DELETE().build(), HttpResponse.BodyHandlers.ofString())
        })

    private fun request(url: String, token: String?): HttpRequest.Builder =
        HttpRequest.newBuilder(URI.create(url)).apply {
            if (token != null) header("Authorization", "Bearer $token")
        }

    companion object {
        @JvmField
        val POSTGRES: PostgreSQLContainer =
            PostgreSQLContainer("postgres:16-alpine").apply { start() }

        lateinit var apiBase: String
        lateinit var managementBase: String

        private lateinit var apiServer: io.ktor.server.engine.EmbeddedServer<*, *>
        private lateinit var managementServer: io.ktor.server.engine.EmbeddedServer<*, *>

        @BeforeAll
        @JvmStatic
        fun startServers() {
            val config = AppConfig(
                serverPort = freePort(),
                managementPort = freePort(),
                jdbcUrl = POSTGRES.jdbcUrl,
                dbUser = POSTGRES.username,
                dbPassword = POSTGRES.password,
                jwtSecret = "test-secret-test-secret-test-secret-32",
                jwtExpirationMs = 3_600_000L,
            )
            val dataSource = Database.createDataSource(config)
            Database.migrate(dataSource)
            val deps = AppDependencies(dataSource, config)
            deps.userSeeder.seed()

            managementServer = embeddedServer(Netty, port = config.managementPort) {
                managementModule(deps)
            }.start(wait = false)
            apiServer = embeddedServer(Netty, port = config.serverPort) {
                appModule(deps)
            }.start(wait = false)

            apiBase = "http://127.0.0.1:${config.serverPort}"
            managementBase = "http://127.0.0.1:${config.managementPort}"
        }

        @AfterAll
        @JvmStatic
        fun stopServers() {
            apiServer.stop()
            managementServer.stop()
        }

        private fun freePort(): Int = ServerSocket(0).use { it.localPort }
    }
}
