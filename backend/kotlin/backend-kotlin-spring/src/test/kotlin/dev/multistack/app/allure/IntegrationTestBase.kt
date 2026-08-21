package dev.multistack.app.allure

import io.qameta.allure.Allure
import io.qameta.allure.Owner
import org.junit.jupiter.api.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.testcontainers.containers.PostgreSQLContainer

/**
 * Full Spring Boot context against real PostgreSQL — classical application integration.
 * Runs in CI before build/deploy; not HTTP against a live stand.
 */
@Owner("stanislav")
@Layer("integration")
@Tag("integration")
@Module("backend-kotlin-spring")
@Language("kotlin")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class IntegrationTestBase {

    @Autowired
    protected lateinit var rest: TestRestTemplate

    protected fun <T> getJson(url: String, type: Class<T>): ResponseEntity<T> =
        Allure.step("GET $url", Allure.ThrowableRunnable { rest.getForEntity(url, type) })

    protected fun <T> postJson(url: String, body: Any, type: Class<T>): ResponseEntity<T> =
        Allure.step("POST $url", Allure.ThrowableRunnable { rest.postForEntity(url, jsonEntity(body), type) })

    protected fun <T> exchangeJson(
        url: String,
        method: HttpMethod,
        entity: HttpEntity<*>,
        type: Class<T>,
    ): ResponseEntity<T> =
        Allure.step(
            "${method.name()} $url",
            Allure.ThrowableRunnable { rest.exchange(url, method, entity, type) },
        )

    protected fun bearerEntity(token: String): HttpEntity<Void> {
        val headers = HttpHeaders()
        headers.setBearerAuth(token)
        return HttpEntity(headers)
    }

    protected fun <T> jsonEntity(body: T): HttpEntity<T> {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        return HttpEntity(body, headers)
    }

    companion object {
        @ServiceConnection
        @JvmField
        val POSTGRES: PostgreSQLContainer<*> =
            PostgreSQLContainer("postgres:16-alpine").apply { start() }
    }
}
