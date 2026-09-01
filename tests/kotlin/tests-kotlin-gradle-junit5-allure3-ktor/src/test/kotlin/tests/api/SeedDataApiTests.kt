package tests.api

import annotations.Layer
import api.ApiTestBase
import api.KtorHttp
import io.ktor.http.HttpMethod
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

@Layer("api")
@Epic("Deploy readiness")
@Feature("Seed data")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Seed data on deployed stand")
class SeedDataApiTests : ApiTestBase() {

    @Test
    @Tag("api")
    @Tag("smoke")
    @DisplayName("Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")
    fun seededItemsAreReadyAfterDeploy() {
        val response = KtorHttp.request(HttpMethod.Get, "/api/items")
        assertEquals(200, response.status, response.body)
        assertEquals("postgresql", response.text("source"))
        val names = response.itemNames()
        assertTrue(names.containsAll(listOf("Alpha", "Beta", "Gamma")), names.toString())
    }
}
